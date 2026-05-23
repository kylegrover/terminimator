import type {
  FrameLine,
  FrameNode,
  PlaygroundState,
} from '../schema/frame'

function jsValue(value: string) {
  return JSON.stringify(value)
}

function rustString(value: string) {
  return `"${value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')}"`
}

function rustChar(value: string, fallback: string) {
  const [character = fallback] = Array.from(value)
  const escaped = character.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
  return `'${escaped}'`
}

function renderJsNode(node: FrameNode) {
  switch (node.type) {
    case 'text':
      return `    { type: 'text', value: ${jsValue(node.value)} }`
    case 'repeat':
      return `    { type: 'repeat', value: ${jsValue(node.value)}, count: ${node.count}, animated: ${node.animated} }`
    case 'progressBar':
      return `    { type: 'progressBar', width: ${node.width}, filled: ${jsValue(node.filled)}, empty: ${jsValue(node.empty)}, showCounter: ${node.showCounter} }`
  }
}

function renderRustNode(node: FrameNode) {
  switch (node.type) {
    case 'text':
      return `Node::Text(String::from(${rustString(node.value)}))`
    case 'repeat':
      return `Node::Repeat { value: String::from(${rustString(node.value)}), count: ${node.count}, animated: ${node.animated} }`
    case 'progressBar':
      return `Node::ProgressBar { width: ${node.width}, filled: ${rustChar(node.filled, '=')}, empty: ${rustChar(node.empty, '.')}, show_counter: ${node.showCounter} }`
  }
}

function pythonSceneLiteral(lines: FrameLine[]) {
  return JSON.stringify(
    {
      lines: lines.map((line) => ({
        nodes: line.nodes.map((node) => {
          if (node.type === 'text') {
            return { type: node.type, value: node.value }
          }

          if (node.type === 'repeat') {
            return {
              type: node.type,
              value: node.value,
              count: node.count,
              animated: node.animated,
            }
          }

          return {
            type: node.type,
            width: node.width,
            filled: node.filled,
            empty: node.empty,
            showCounter: node.showCounter,
          }
        }),
      })),
    },
  )
}

function nodeSummary(node: FrameNode) {
  switch (node.type) {
    case 'text':
      return `text(${node.value.length})`
    case 'repeat':
      return `repeat(${node.count})`
    case 'progressBar':
      return `progress(${node.width})`
  }
}

export function generateCode(state: PlaygroundState) {
  switch (state.exportTarget) {
    case 'js':
      return generateJsCode(state)
    case 'py':
      return generatePythonCode(state)
    case 'rust':
      return generateRustCode(state)
  }
}

function generateJsCode(state: PlaygroundState) {
  const sceneLines = state.scene.lines
    .map(
      (line) => `  [\n${line.nodes.map(renderJsNode).join(',\n')}\n  ]`,
    )
    .join(',\n')

  return `const scene = {
  lines: [
${sceneLines}
  ],
}

function renderNode(node, ctx) {
  switch (node.type) {
    case 'text':
      return node.value
    case 'repeat': {
      const count = node.animated ? ctx.frame % (node.count + 1) : node.count
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

function renderScene(ctx) {
  return scene.lines
    .map((line) => line.map((node) => renderNode(node, ctx)).join(''))
    .join('\n')
}

let frame = ${state.playback.frame}
let current = ${state.playback.current}
const total = ${state.playback.total}

const timer = setInterval(() => {
  process.stderr.write('\x1b[2J\x1b[H' + renderScene({ frame, current, total }))
  frame += 1
  current = Math.min(total, current + 1)

  if (current >= total) {
    clearInterval(timer)
    process.stderr.write('\n')
  }
}, 100)
`
}

function generatePythonCode(state: PlaygroundState) {
  const sceneLiteral = JSON.stringify(pythonSceneLiteral(state.scene.lines))

  return `import json
import sys
import time

SCENE = json.loads(${sceneLiteral})


def render_node(node, ctx):
    if node["type"] == "text":
        return node["value"]

    if node["type"] == "repeat":
        count = ctx["frame"] % (node["count"] + 1) if node["animated"] else node["count"]
        return node["value"] * count

    safe_total = max(ctx["total"], 1)
    ratio = max(0.0, min(ctx["current"] / safe_total, 1.0))
    filled_count = round(ratio * node["width"])
    bar = node["filled"] * filled_count + node["empty"] * (node["width"] - filled_count)
    counter = f" {ctx['current']}/{ctx['total']}" if node["showCounter"] else ""
    return f"[{bar}]{counter}"


def render_scene(ctx):
    return "\n".join(
        "".join(render_node(node, ctx) for node in line["nodes"])
        for line in SCENE["lines"]
    )


frame = ${state.playback.frame}
current = ${state.playback.current}
total = ${state.playback.total}

while True:
    sys.stderr.write("\x1b[2J\x1b[H" + render_scene({"frame": frame, "current": current, "total": total}))
    sys.stderr.flush()

    if current >= total:
        sys.stderr.write("\n")
        break

    time.sleep(0.1)
    frame += 1
    current = min(total, current + 1)
`
}

function generateRustCode(state: PlaygroundState) {
  const sceneLines = state.scene.lines
    .map(
      (line) => `        vec![${line.nodes.map(renderRustNode).join(', ')}]`,
    )
    .join(',\n')

  return `use std::thread;
use std::time::Duration;

#[derive(Clone)]
enum Node {
    Text(String),
    Repeat { value: String, count: usize, animated: bool },
    ProgressBar { width: usize, filled: char, empty: char, show_counter: bool },
}

fn render_node(node: &Node, frame: usize, current: usize, total: usize) -> String {
    match node {
        Node::Text(value) => value.clone(),
        Node::Repeat { value, count, animated } => {
            let amount = if *animated { frame % (count + 1) } else { *count };
            value.repeat(amount)
        }
        Node::ProgressBar { width, filled, empty, show_counter } => {
            let safe_total = total.max(1);
            let ratio = current as f32 / safe_total as f32;
            let filled_count = (ratio.clamp(0.0, 1.0) * *width as f32).round() as usize;
            let bar = filled.to_string().repeat(filled_count)
                + &empty.to_string().repeat(width.saturating_sub(filled_count));
            let counter = if *show_counter {
                format!(" {}/{}", current, total)
            } else {
                String::new()
            };
            format!("[{}]{}", bar, counter)
        }
    }
}

fn render_scene(scene: &[Vec<Node>], frame: usize, current: usize, total: usize) -> String {
    scene
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
    let scene = vec![
${sceneLines}
    ];

    let total = ${state.playback.total}usize;
    let mut current = ${state.playback.current}usize;
    let mut frame = ${state.playback.frame}usize;

    loop {
        eprint!("\x1b[2J\x1b[H{}", render_scene(&scene, frame, current, total));

        if current >= total {
            eprintln!();
            break;
        }

        thread::sleep(Duration::from_millis(100));
        frame += 1;
        current = (current + 1).min(total);
    }
}
`
}

export function summarizeScene(state: PlaygroundState) {
  return state.scene.lines
    .map((line, index) => `line ${index + 1}: ${line.nodes.map(nodeSummary).join(' + ')}`)
    .join('\n')
}