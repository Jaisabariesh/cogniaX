
/**
 * tiptaptollm.js
 * Converts Tiptap editor JSON to a simplified LLM-friendly JSON format.
 *
 * Supported node types:
 *   heading, paragraph, horizontalRule, codeBlock,
 *   taskList, orderedList, bulletList, chemistry,
 *   flowBlock, desmosBlock, konvaDraw, mathquill
 *
 * Dropped node types (not needed for evaluation):
 *   p5js, image, empty paragraphs
 */

/**
 * Extract plain text from a Tiptap node tree.
 * @param {Object} node
 * @returns {string}
 */
export function extractText(node) {
    if (!node.content) return "";
    return node.content
        .map((n) => (n.type === "text" ? n.text || "" : extractText(n)))
        .join("");
}

/**
 * Extract all unique marks (bold, italic, etc.) from a node tree.
 * @param {Object} node
 * @returns {Array}
 */
export function extractMarks(node) {
    const marks = [];
    const traverse = (n) => {
        if (n.type === "text" && n.marks) {
            n.marks.forEach((m) => {
                if (!marks.find((x) => x.type === m.type)) marks.push(m);
            });
        }
        (n.content || []).forEach(traverse);
    };
    traverse(node);
    return marks;
}

/**
 * Convert a single Tiptap node to its LLM-friendly equivalent.
 * Returns null for nodes that should be dropped.
 * Returns an array for nodes that expand into multiple items (e.g. taskList).
 *
 * @param {Object} node - A single Tiptap content node
 * @returns {Object|Object[]|null}
 */
export function convertNode(node) {
    const t = node.type;

    // ── Heading ──────────────────────────────────────────────────────────────
    if (t === "heading") {
        return {
            type: "heading",
            level: node.attrs?.level ?? 1,
            text: extractText(node),
        };
    }

    // ── Paragraph ─────────────────────────────────────────────────────────────
    if (t === "paragraph") {
        const text = extractText(node);
        if (!text) return null; // drop empty paragraphs
        const out = { type: "paragraph", text };
        const marks = extractMarks(node);
        if (marks.length) out.marks = marks;
        return out;
    }

    // ── Horizontal rule ───────────────────────────────────────────────────────
    if (t === "horizontalRule") {
        return { type: "hr" };
    }

    // ── Code block ────────────────────────────────────────────────────────────
    if (t === "codeBlock") {
        const out = { type: "code", text: extractText(node) };
        if (node.attrs?.language) out.language = node.attrs.language;
        return out;
    }

    // ── Task list ─────────────────────────────────────────────────────────────
    // Expands into an array of task items
    if (t === "taskList") {
        return (node.content || []).map((item) => ({
            type: "task",
            text: extractText(item),
            done: item.attrs?.checked ?? false,
        }));
    }

    // ── Ordered list ──────────────────────────────────────────────────────────
    if (t === "orderedList") {
        return {
            type: "list",
            style: "ordered",
            items: (node.content || []).map((li) => extractText(li)),
        };
    }

    // ── Bullet list ───────────────────────────────────────────────────────────
    if (t === "bulletList") {
        return {
            type: "list",
            style: "unordered",
            items: (node.content || []).map((li) => extractText(li)),
        };
    }

    // ── Chemistry (SMILES) ────────────────────────────────────────────────────
    if (t === "chemistry") {
        return { type: "chemistry", smiles: node.attrs?.smiles };
    }

    // ── Flow diagram ──────────────────────────────────────────────────────────
    if (t === "flowBlock") {
        let nodes = {};
        let edges = [];
        try {
            const rawNodes = JSON.parse(node.attrs?.nodes || "[]");
            const rawEdges = JSON.parse(node.attrs?.edges || "[]");
            rawNodes.forEach((n) => {
                nodes[n.id] = n.data?.label ?? "";
            });
            edges = rawEdges.map((e) => [e.source, e.target]);
        } catch (err) {
            console.warn("flowBlock parse error:", err);
        }
        return { type: "flow", nodes, edges };
    }

    // ── Graph / Desmos ────────────────────────────────────────────────────────
    if (t === "desmosBlock") {
        const expressions = (node.attrs?.expressions || []).map((e) =>
            e
                .replace(/\\sin/g, "sin")
                .replace(/\\cos/g, "cos")
                .replace(/\\tan/g, "tan")
                .replace(/\\pi/g, "pi")
                .replace(/\\/g, "")
                .trim()
        );
        return { type: "graph", engine: "desmos", expressions };
    }

    // ── Drawing (Konva) ───────────────────────────────────────────────────────
    if (t === "konvaDraw") {
        let shapes = [];
        try {
            const raw = JSON.parse(node.attrs?.shapes || "[]");
            shapes = raw.map((s) => {
                const out = { type: s.type };
                if (s.x !== undefined) out.x = s.x;
                if (s.y !== undefined) out.y = s.y;
                if (s.radius !== undefined) out.r = s.radius;       // normalize radius → r
                if (s.radiusX !== undefined) out.rx = s.radiusX;
                if (s.radiusY !== undefined) out.ry = s.radiusY;
                if (s.sides !== undefined) out.sides = s.sides;
                if (s.points !== undefined) out.points = s.points;
                if (s.text !== undefined) out.text = s.text;
                if (s.fontSize !== undefined) out.fontSize = s.fontSize;
                return out;
            });
        } catch (err) {
            console.warn("konvaDraw parse error:", err);
        }
        return { type: "drawing", shapes };
    }

    // ── Math (MathQuill) ──────────────────────────────────────────────────────
    if (t === "mathquill") {
        return { type: "math", latex: node.attrs?.latex };
    }

    // ── Dropped node types ────────────────────────────────────────────────────
    if (t === "p5js" || t === "image") {
        return null;
    }

    // Unknown node — drop with a warning
    console.warn(`tiptapToLLM: unknown node type "${t}" — skipped`);
    return null;
}

/**
 * Custom stringifier that removes quotes from keys and structural values,
 * but keeps them for the actual note content.
 * 
 * @param {any} obj - The object to stringify
 * @param {number} indent - Current indentation level
 * @returns {string}
 */
export function stringifyToLLM(obj, indent = 0) {
    const space = "  ".repeat(indent);
    const nextSpace = "  ".repeat(indent + 1);

    if (Array.isArray(obj)) {
        if (obj.length === 0) return "[]";

        // Short arrays of simple content (like list items) can stay on one line
        const allPrimitives = obj.every(x => typeof x !== 'object' || x === null);
        if (allPrimitives && obj.length < 10) {
            return "[" + obj.map(x => typeof x === 'string' ? JSON.stringify(x) : String(x)).join(", ") + "]";
        }

        return `[\n${obj.map(item => nextSpace + stringifyToLLM(item, indent + 1)).join(",\n")}\n${space}]`;
    }

    if (typeof obj === "object" && obj !== null) {
        const entries = Object.entries(obj);
        if (entries.length === 0) return "{}";

        const parts = entries.map(([key, value]) => {
            let valStr;
            // Define what is "content" vs "structure"
            // Content keys keep their quotes
            const isContentKey = ["text", "smiles", "latex", "label", "expressions", "items"].includes(key);

            if (isContentKey) {
                if (Array.isArray(value)) {
                    valStr = `[${value.map(v => JSON.stringify(v)).join(", ")}]`;
                } else {
                    valStr = JSON.stringify(value);
                }
            } else if (typeof value === "string") {
                // Structural strings: remove quotes (e.g. "type": "paragraph" -> type: paragraph)
                valStr = value;
            } else if (typeof value === "object" && value !== null) {
                valStr = stringifyToLLM(value, indent + 1);
            } else {
                // Numbers, booleans
                valStr = String(value);
            }
            return `${key}: ${valStr}`;
        });

        return `{\n${parts.map(p => nextSpace + p).join(",\n")}\n${space}}`;
    }

    // Default for other types
    return JSON.stringify(obj);
}

/**
 * Convert a full Tiptap document JSON to an LLM-friendly string.
 *
 * @param {Object} tiptapDoc - The full Tiptap doc object ({ type: "doc", content: [...] })
 * @returns {string} - LLM-friendly string representation
 */
export function tiptapToLLM(tiptapDoc) {
    if (!tiptapDoc || tiptapDoc.type !== "doc") {
        throw new Error('Input must be a Tiptap doc object with type "doc"');
    }

    const content = [];

    for (const node of tiptapDoc.content || []) {
        const converted = convertNode(node);
        if (converted === null) continue;
        if (Array.isArray(converted)) {
            content.push(...converted);
        } else {
            content.push(converted);
        }
    }

    return stringifyToLLM({ type: "doc", content });
}