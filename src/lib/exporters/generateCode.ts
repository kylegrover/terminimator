import type {
  AlignMode,
  EffectDefinition,
  ExportTarget,
  FrameNode,
  PlaybackState,
  ValueSource,
} from '../schema/frame'

function effectJson(effect: EffectDefinition) {
  return JSON.stringify(effect, null, 2)
}

function pythonEffectLiteral(effect: EffectDefinition) {
  return JSON.stringify(JSON.stringify(effect))
}

function rustString(value: string) {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')}"`
}

function rustStringArray(values: string[]) {
  return `vec![${values.map((value) => `String::from(${rustString(value)})`).join(', ')}]`
}

function rustOptionalNumber(value: number | undefined) {
  return value === undefined ? 'None' : `Some(${value}usize)`
}

function rustAlignMode(align: AlignMode) {
  switch (align) {
    case 'right':
      return 'AlignMode::Right'
    case 'center':
      return 'AlignMode::Center'
    default:
      return 'AlignMode::Left'
  }
}

function rustValueSource(source: ValueSource) {
  switch (source) {
    case 'frame':
      return 'ValueSource::Frame'
    case 'current':
      return 'ValueSource::Current'
    case 'total':
      return 'ValueSource::Total'
  }
}

function renderRustNode(node: FrameNode): string {
  switch (node.type) {
    case 'text':
      return `Node::Text(String::from(${rustString(node.value)}))`
    case 'value':
      return `Node::Value(${rustValueSource(node.source)})`
    case 'repeat':
      return `Node::Repeat { value: String::from(${rustString(node.value)}), count: ${node.count}, from_frame: ${node.from === 'frame'} }`
    case 'progressBar':
      return `Node::ProgressBar { width: ${node.width}, filled: String::from(${rustString(node.filled)}), empty: String::from(${rustString(node.empty)}), show_counter: ${node.showCounter} }`
    case 'spinner':
      return `Node::Spinner(${rustStringArray(node.frames)})`
    case 'marquee':
      return `Node::Marquee { value: String::from(${rustString(node.value)}), width: ${node.width}, gap: String::from(${rustString(node.gap)}) }`
    case 'combineMarks':
      return `Node::CombineMarks { value: String::from(${rustString(node.value)}), marks: ${rustStringArray(node.marks)}, depth: ${node.depth}, from_frame: ${node.from === 'frame'} }`
    case 'pad':
      return `Node::Pad { parts: vec![${node.parts.map(renderRustNode).join(', ')}], width: ${node.width}, align: ${rustAlignMode(node.align)}, fill: String::from(${rustString(node.fill)}) }`
    case 'gate':
      return `Node::Gate { parts: vec![${node.parts.map(renderRustNode).join(', ')}], from: ${rustValueSource(node.from)}, gt: ${rustOptionalNumber(node.gt)}, gte: ${rustOptionalNumber(node.gte)}, lt: ${rustOptionalNumber(node.lt)}, lte: ${rustOptionalNumber(node.lte)}, eq: ${rustOptionalNumber(node.eq)} }`
  }
}

function generateJsCode(effect: EffectDefinition, playback: PlaybackState) {
  return `const effect = ${effectJson(effect)}

const fps = ${playback.fps}
const loop = ${playback.loop}
const delay = Math.max(1, Math.round(1000 / Math.max(fps, 1)))

function valueFromSource(source, ctx) {
  return ctx[source]
}

function renderNodes(nodes, ctx) {
  return nodes.map((node) => renderNode(node, ctx)).join('')
}

function alignText(value, width, align, fill) {
  const safeWidth = Math.min(Math.max(width, 1), 80)
  const visibleLength = Array.from(value).length

  if (visibleLength >= safeWidth) {
    return value
  }

  const fillGlyph = Array.from(fill || ' ')[0] ?? ' '
  const gap = safeWidth - visibleLength

  if (align === 'right') {
    return fillGlyph.repeat(gap) + value
  }

  if (align === 'center') {
    const left = Math.floor(gap / 2)
    const right = gap - left
    return fillGlyph.repeat(left) + value + fillGlyph.repeat(right)
  }

  return value + fillGlyph.repeat(gap)
}

function passesGate(node, ctx) {
  const value = valueFromSource(node.from, ctx)

  if (node.eq !== undefined && value !== node.eq) {
    return false
  }

  if (node.gt !== undefined && value <= node.gt) {
    return false
  }

  if (node.gte !== undefined && value < node.gte) {
    return false
  }

  if (node.lt !== undefined && value >= node.lt) {
    return false
  }

  if (node.lte !== undefined && value > node.lte) {
    return false
  }

  return true
}

function renderSpinner(node, ctx) {
  const frames = node.frames.length ? node.frames : ['|', '/', '-', '\\\\']
  const index = ((ctx.frame % frames.length) + frames.length) % frames.length
  return frames[index] ?? ''
}

function renderMarquee(node, ctx) {
  const width = Math.min(Math.max(node.width, 4), 80)
  const gap = node.gap && node.gap.length > 0 ? node.gap : ' '
  const source = Array.from((node.value ?? '') + gap)

  if (!source.length) {
    return ''
  }

  const start = ((ctx.frame % source.length) + source.length) % source.length
  let output = ''

  for (let offset = 0; offset < width; offset += 1) {
    output += source[(start + offset) % source.length] ?? ' '
  }

  return output
}

function renderCombineMarks(node, ctx) {
  const marks = node.marks.length ? node.marks : ['\u0307', '\u0323', '\u0334']
  const seed = node.from === 'frame' ? ctx.frame : 0
  let output = ''
  let glyphIndex = 0

  for (const char of Array.from(node.value)) {
    output += char

    if (/\\s/u.test(char)) {
      continue
    }

    for (let depthIndex = 0; depthIndex < node.depth; depthIndex += 1) {
      output += marks[(seed + glyphIndex + depthIndex) % marks.length] ?? ''
    }

    glyphIndex += 1
  }

  return output
}

function renderNode(node, ctx) {
  switch (node.type) {
    case 'text':
      return node.value
    case 'value':
      return String(ctx[node.source])
    case 'repeat': {
      const count = node.from === 'frame' ? ctx.frame % (node.count + 1) : node.count
      return node.value.repeat(count)
    }
    case 'progressBar': {
      const safeTotal = Math.max(ctx.total, 1)
      const ratio = Math.min(Math.max(ctx.current / safeTotal, 0), 1)
      const filledCount = Math.round(ratio * node.width)
      const bar = node.filled.repeat(filledCount) + node.empty.repeat(node.width - filledCount)
      const counter = node.showCounter ? ' ' + ctx.current + '/' + ctx.total : ''
      return '[' + bar + ']' + counter
    }
    case 'spinner':
      return renderSpinner(node, ctx)
    case 'marquee':
      return renderMarquee(node, ctx)
    case 'combineMarks':
      return renderCombineMarks(node, ctx)
    case 'pad':
      return alignText(renderNodes(node.parts, ctx), node.width, node.align, node.fill)
    case 'gate':
      return passesGate(node, ctx) ? renderNodes(node.parts, ctx) : ''
    default:
      return ''
  }
}

function renderEffect(ctx) {
  return effect.lines
    .map((line) => renderNodes(line, ctx))
    .join('\n')
}

let frame = ${playback.frame}
let current = ${playback.current}
const total = ${playback.total}

const timer = setInterval(() => {
  process.stderr.write('\x1b[2J\x1b[H' + renderEffect({ frame, current, total }))

  if (!loop && current >= total) {
    clearInterval(timer)
    process.stderr.write('\n')
    return
  }

  frame += 1
  current = loop ? (current >= total ? 0 : current + 1) : Math.min(total, current + 1)
}, delay)
`
}

function generatePythonCode(effect: EffectDefinition, playback: PlaybackState) {
  return `import json
import sys
import time

EFFECT = json.loads(${pythonEffectLiteral(effect)})
FPS = ${playback.fps}
LOOP = ${playback.loop}
DELAY = 1 / max(FPS, 1)
DEFAULT_COMBINING_MARKS = ["\u0307", "\u0323", "\u0334"]


def value_from_source(source, ctx):
  return ctx[source]


def render_nodes(nodes, ctx):
  return "".join(render_node(node, ctx) for node in nodes)


def align_text(value, width, align, fill):
  safe_width = max(1, min(int(width), 80))
  visible_length = len(value)
  if visible_length >= safe_width:
    return value

  fill_glyph = (fill or " ")[0]
  gap = safe_width - visible_length

  if align == "right":
    return fill_glyph * gap + value

  if align == "center":
    left = gap // 2
    right = gap - left
    return fill_glyph * left + value + fill_glyph * right

  return value + fill_glyph * gap


def passes_gate(node, ctx):
  value = value_from_source(node["from"], ctx)

  if node.get("eq") is not None and value != node["eq"]:
    return False
  if node.get("gt") is not None and value <= node["gt"]:
    return False
  if node.get("gte") is not None and value < node["gte"]:
    return False
  if node.get("lt") is not None and value >= node["lt"]:
    return False
  if node.get("lte") is not None and value > node["lte"]:
    return False

  return True


def render_spinner(node, ctx):
  frames = node["frames"] if node["frames"] else ["|", "/", "-", "\\"]
  return frames[ctx["frame"] % len(frames)]


def render_marquee(node, ctx):
  width = max(4, min(int(node["width"]), 80))
  gap = node["gap"] if node["gap"] else " "
  source = (node["value"] + gap) or " "
  start = ctx["frame"] % len(source)
  return "".join(source[(start + offset) % len(source)] for offset in range(width))


def render_combine_marks(node, ctx):
  marks = node["marks"] if node["marks"] else DEFAULT_COMBINING_MARKS
  seed = ctx["frame"] if node["from"] == "frame" else 0
  output = []
  glyph_index = 0

  for char in node["value"]:
    output.append(char)
    if char.isspace():
      continue

    for depth_index in range(node["depth"]):
      output.append(marks[(seed + glyph_index + depth_index) % len(marks)])

    glyph_index += 1

  return "".join(output)


def render_node(node, ctx):
    if node["type"] == "text":
        return node["value"]

  if node["type"] == "value":
    return str(ctx[node["source"]])

    if node["type"] == "repeat":
        count = ctx["frame"] % (node["count"] + 1) if node["from"] == "frame" else node["count"]
        return node["value"] * count

  if node["type"] == "spinner":
    return render_spinner(node, ctx)

  if node["type"] == "marquee":
    return render_marquee(node, ctx)

  if node["type"] == "combineMarks":
    return render_combine_marks(node, ctx)

  if node["type"] == "pad":
    return align_text(render_nodes(node["parts"], ctx), node["width"], node["align"], node["fill"])

  if node["type"] == "gate":
    return render_nodes(node["parts"], ctx) if passes_gate(node, ctx) else ""

    safe_total = max(ctx["total"], 1)
    ratio = max(0.0, min(ctx["current"] / safe_total, 1.0))
    filled_count = round(ratio * node["width"])
    bar = node["filled"] * filled_count + node["empty"] * (node["width"] - filled_count)
    counter = f" {ctx['current']}/{ctx['total']}" if node["showCounter"] else ""
    return f"[{bar}]{counter}"


def render_effect(ctx):
    return "\n".join(
    render_nodes(line, ctx)
        for line in EFFECT["lines"]
    )


frame = ${playback.frame}
current = ${playback.current}
total = ${playback.total}

while True:
    sys.stderr.write("\x1b[2J\x1b[H" + render_effect({"frame": frame, "current": current, "total": total}))
    sys.stderr.flush()

    if not LOOP and current >= total:
        sys.stderr.write("\n")
        break

    time.sleep(DELAY)
    frame += 1
    current = 0 if LOOP and current >= total else min(total, current + 1)
`
}

function generateRustCode(effect: EffectDefinition, playback: PlaybackState) {
  const sceneLines = effect.lines
    .map((line) => `        vec![${line.map(renderRustNode).join(', ')}]`)
    .join(',\n')

  return `use std::thread;
use std::time::Duration;

#[derive(Clone)]
enum ValueSource {
  Frame,
  Current,
  Total,
}

#[derive(Clone)]
enum AlignMode {
  Left,
  Right,
  Center,
}

#[derive(Clone)]
enum Node {
    Text(String),
  Value(ValueSource),
    Repeat { value: String, count: usize, from_frame: bool },
    ProgressBar { width: usize, filled: String, empty: String, show_counter: bool },
  Spinner(Vec<String>),
  Marquee { value: String, width: usize, gap: String },
  CombineMarks { value: String, marks: Vec<String>, depth: usize, from_frame: bool },
  Pad { parts: Vec<Node>, width: usize, align: AlignMode, fill: String },
  Gate { parts: Vec<Node>, from: ValueSource, gt: Option<usize>, gte: Option<usize>, lt: Option<usize>, lte: Option<usize>, eq: Option<usize> },
}

fn value_from_source(source: &ValueSource, frame: usize, current: usize, total: usize) -> usize {
  match source {
    ValueSource::Frame => frame,
    ValueSource::Current => current,
    ValueSource::Total => total,
  }
}

fn render_nodes(nodes: &[Node], frame: usize, current: usize, total: usize) -> String {
  nodes
    .iter()
    .map(|node| render_node(node, frame, current, total))
    .collect::<Vec<_>>()
    .join("")
}

fn align_text(value: &str, width: usize, align: &AlignMode, fill: &str) -> String {
  let safe_width = width.clamp(1, 80);
  let visible_length = value.chars().count();

  if visible_length >= safe_width {
    return value.to_string();
  }

  let fill_glyph = fill.chars().next().unwrap_or(' ');
  let gap = safe_width - visible_length;

  match align {
    AlignMode::Right => format!("{}{}", fill_glyph.to_string().repeat(gap), value),
    AlignMode::Center => {
      let left = gap / 2;
      let right = gap - left;
      format!(
        "{}{}{}",
        fill_glyph.to_string().repeat(left),
        value,
        fill_glyph.to_string().repeat(right)
      )
    }
    AlignMode::Left => format!("{}{}", value, fill_glyph.to_string().repeat(gap)),
  }
}

fn passes_gate(
  from: &ValueSource,
  gt: &Option<usize>,
  gte: &Option<usize>,
  lt: &Option<usize>,
  lte: &Option<usize>,
  eq: &Option<usize>,
  frame: usize,
  current: usize,
  total: usize,
) -> bool {
  let value = value_from_source(from, frame, current, total);

  if let Some(eq_value) = eq {
    if value != *eq_value {
      return false;
    }
  }

  if let Some(gt_value) = gt {
    if value <= *gt_value {
      return false;
    }
  }

  if let Some(gte_value) = gte {
    if value < *gte_value {
      return false;
    }
  }

  if let Some(lt_value) = lt {
    if value >= *lt_value {
      return false;
    }
  }

  if let Some(lte_value) = lte {
    if value > *lte_value {
      return false;
    }
  }

  true
}

fn render_spinner(frames: &[String], frame: usize) -> String {
  let fallback_frames = vec![
    String::from("|"),
    String::from("/"),
    String::from("-"),
    String::from("\\"),
  ];
  let active_frames: &[String] = if frames.is_empty() { &fallback_frames } else { frames };
  active_frames[frame % active_frames.len()].clone()
}

fn render_marquee(value: &str, gap: &str, width: usize, frame: usize) -> String {
  let width = width.clamp(4, 80);
  let gap = if gap.is_empty() { " " } else { gap };
  let source_chars: Vec<char> = format!("{}{}", value, gap).chars().collect();

  if source_chars.is_empty() {
    return String::new();
  }

  let start = frame % source_chars.len();
  let mut output = String::new();

  for offset in 0..width {
    output.push(source_chars[(start + offset) % source_chars.len()]);
  }

  output
}

fn render_combine_marks(
  value: &str,
  marks: &[String],
  depth: usize,
  from_frame: bool,
  frame: usize,
) -> String {
  let fallback_marks = vec![
    String::from("\u{0307}"),
    String::from("\u{0323}"),
    String::from("\u{0334}"),
  ];
  let active_marks: &[String] = if marks.is_empty() { &fallback_marks } else { marks };
  let seed = if from_frame { frame } else { 0 };
  let mut output = String::new();
  let mut glyph_index = 0usize;

  for ch in value.chars() {
    output.push(ch);

    if ch.is_whitespace() {
      continue;
    }

    for depth_index in 0..depth {
      output.push_str(&active_marks[(seed + glyph_index + depth_index) % active_marks.len()]);
    }

    glyph_index += 1;
  }

  output
}

fn render_node(node: &Node, frame: usize, current: usize, total: usize) -> String {
    match node {
        Node::Text(value) => value.clone(),
    Node::Value(source) => match source {
      ValueSource::Frame => frame.to_string(),
      ValueSource::Current => current.to_string(),
      ValueSource::Total => total.to_string(),
    },
        Node::Repeat { value, count, from_frame } => {
            let amount = if *from_frame { frame % (count + 1) } else { *count };
            value.repeat(amount)
        }
        Node::ProgressBar { width, filled, empty, show_counter } => {
            let safe_total = total.max(1);
            let ratio = current as f32 / safe_total as f32;
            let filled_count = (ratio.clamp(0.0, 1.0) * *width as f32).round() as usize;
            let bar = filled.repeat(filled_count) + &empty.repeat(width.saturating_sub(filled_count));
            let counter = if *show_counter {
                format!(" {}/{}", current, total)
            } else {
                String::new()
            };
            format!("[{}]{}", bar, counter)
        }
          Node::Spinner(frames) => render_spinner(frames, frame),
          Node::Marquee { value, width, gap } => render_marquee(value, gap, *width, frame),
          Node::CombineMarks { value, marks, depth, from_frame } => {
            render_combine_marks(value, marks, *depth, *from_frame, frame)
          }
        Node::Pad { parts, width, align, fill } => {
          align_text(&render_nodes(parts, frame, current, total), *width, align, fill)
        }
        Node::Gate { parts, from, gt, gte, lt, lte, eq } => {
          if passes_gate(from, gt, gte, lt, lte, eq, frame, current, total) {
            render_nodes(parts, frame, current, total)
          } else {
            String::new()
          }
        }
    }
}

fn render_effect(effect: &[Vec<Node>], frame: usize, current: usize, total: usize) -> String {
    effect
        .iter()
    .map(|line| render_nodes(line, frame, current, total))
        .collect::<Vec<_>>()
        .join("\n")
}

fn main() {
    let effect = vec![
${sceneLines}
    ];

    let fps = ${playback.fps}usize;
    let loop_playback = ${playback.loop};
    let delay = Duration::from_millis((1000 / fps.max(1)) as u64);
    let total = ${playback.total}usize;
    let mut current = ${playback.current}usize;
    let mut frame = ${playback.frame}usize;

    loop {
        eprint!("\x1b[2J\x1b[H{}", render_effect(&effect, frame, current, total));

        if !loop_playback && current >= total {
            eprintln!();
            break;
        }

        thread::sleep(delay);
        frame += 1;
        current = if loop_playback && current >= total {
            0
        } else {
            (current + 1).min(total)
        };
    }
}
`
}

export function generateCode(
  effect: EffectDefinition,
  playback: PlaybackState,
  target: ExportTarget,
) {
  switch (target) {
    case 'js':
      return generateJsCode(effect, playback)
    case 'py':
      return generatePythonCode(effect, playback)
    case 'rust':
      return generateRustCode(effect, playback)
  }
}