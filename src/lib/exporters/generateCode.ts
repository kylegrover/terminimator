import type { EffectDefinition, ExportTarget, FrameNode, PlaybackState } from '../schema/frame'

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

function renderRustNode(node: FrameNode) {
  switch (node.type) {
    case 'text':
      return `Node::Text(String::from(${rustString(node.value)}))`
    case 'repeat':
      return `Node::Repeat { value: String::from(${rustString(node.value)}), count: ${node.count}, from_frame: ${node.from === 'frame'} }`
    case 'progressBar':
      return `Node::ProgressBar { width: ${node.width}, filled: String::from(${rustString(node.filled)}), empty: String::from(${rustString(node.empty)}), show_counter: ${node.showCounter} }`
  }
}

function generateJsCode(effect: EffectDefinition, playback: PlaybackState) {
  return `const effect = ${effectJson(effect)}

const fps = ${playback.fps}
const loop = ${playback.loop}
const delay = Math.max(1, Math.round(1000 / Math.max(fps, 1)))

function renderNode(node, ctx) {
  switch (node.type) {
    case 'text':
      return node.value
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
    default:
      return ''
  }
}

function renderEffect(ctx) {
  return effect.lines
    .map((line) => line.map((node) => renderNode(node, ctx)).join(''))
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


def render_node(node, ctx):
    if node["type"] == "text":
        return node["value"]

    if node["type"] == "repeat":
        count = ctx["frame"] % (node["count"] + 1) if node["from"] == "frame" else node["count"]
        return node["value"] * count

    safe_total = max(ctx["total"], 1)
    ratio = max(0.0, min(ctx["current"] / safe_total, 1.0))
    filled_count = round(ratio * node["width"])
    bar = node["filled"] * filled_count + node["empty"] * (node["width"] - filled_count)
    counter = f" {ctx['current']}/{ctx['total']}" if node["showCounter"] else ""
    return f"[{bar}]{counter}"


def render_effect(ctx):
    return "\n".join(
        "".join(render_node(node, ctx) for node in line)
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
enum Node {
    Text(String),
    Repeat { value: String, count: usize, from_frame: bool },
    ProgressBar { width: usize, filled: String, empty: String, show_counter: bool },
}

fn render_node(node: &Node, frame: usize, current: usize, total: usize) -> String {
    match node {
        Node::Text(value) => value.clone(),
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
    }
}

fn render_effect(effect: &[Vec<Node>], frame: usize, current: usize, total: usize) -> String {
    effect
        .iter()
        .map(|line| {
            line.iter()
                .map(|node| render_node(node, frame, current, total))
                .collect::<Vec<_>>()
                .join("")
        })
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