/**
 * The session-composition instance: one working session mapped onto protocols, lanes and the
 * composition behind it. The shape is provisional (`session-composition-instance/0-dummy`); this
 * module reads it and derives the figures the session charts draw. Node-safe.
 */
export const SESSION_COMPOSITION_FORMAT = 'session-composition-instance/0-dummy';
export function parseSessionComposition(value) {
    const document = value;
    if (typeof value !== 'object' || value === null)
        throw new Error('session document must be an object');
    if (document.format !== SESSION_COMPOSITION_FORMAT)
        throw new Error(`session document format must be ${SESSION_COMPOSITION_FORMAT}`);
    if (Number.isNaN(Date.parse(document.window?.start)) || Number.isNaN(Date.parse(document.window?.end)))
        throw new Error('window.start and window.end must be timestamps');
    for (const key of ['protocols', 'lanes', 'episodes', 'decisions'])
        if (!Array.isArray(document[key]))
            throw new Error(`${key} must be an array`);
    const protocols = new Set(document.protocols.map((protocol) => protocol.id));
    const lanes = new Set(document.lanes.map((lane) => lane.id));
    const clock = /^\d{2}:\d{2}:\d{2}$/;
    document.episodes.forEach((episode, index) => {
        if (!lanes.has(episode.lane))
            throw new Error(`episodes[${index}].lane references unknown lane ${episode.lane}`);
        if (!protocols.has(episode.protocol))
            throw new Error(`episodes[${index}].protocol references unknown protocol ${episode.protocol}`);
        if (!clock.test(episode.start) || !clock.test(episode.end))
            throw new Error(`episodes[${index}] times must be HH:MM:SS`);
    });
    document.decisions.forEach((decision, index) => {
        for (const key of ['question', 'decided', 'relayed', 'drafted'])
            if (!clock.test(decision[key]))
                throw new Error(`decisions[${index}].${key} must be HH:MM:SS`);
    });
    const graph = document.graph;
    if (!graph || !Array.isArray(graph.columns) || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges))
        throw new Error('graph needs columns, nodes and edges');
    const nodes = new Set();
    graph.nodes.forEach((node, index) => {
        if (nodes.has(node.id))
            throw new Error(`graph.nodes[${index}] duplicates ${node.id}`);
        nodes.add(node.id);
        if (!Number.isInteger(node.col) || node.col < 0 || node.col >= graph.columns.length)
            throw new Error(`graph.nodes[${index}].col is outside the columns`);
    });
    graph.edges.forEach(([from, to], index) => {
        if (!nodes.has(from) || !nodes.has(to))
            throw new Error(`graph.edges[${index}] references an unknown node`);
    });
    return document;
}
/** Seconds since the epoch for a clock time inside the session window. */
export function sessionClock(document) {
    const start = Date.parse(document.window.start) / 1000;
    const day = document.window.start.slice(0, 10);
    return (time) => {
        const value = Date.parse(`${day}T${time}Z`) / 1000;
        return value < start - 3600 ? value + 86400 : value;
    };
}
export function formatDuration(seconds) {
    const rounded = Math.round(seconds);
    const minutes = Math.floor(rounded / 60);
    const rest = rounded % 60;
    if (minutes >= 60)
        return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
    return minutes ? `${minutes}m ${String(rest).padStart(2, '0')}s` : `${rest}s`;
}
export function median(values) {
    if (!values.length)
        return 0;
    const sorted = [...values].sort((left, right) => left - right);
    const middle = sorted.length / 2;
    return sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle - 1] + sorted[middle]) / 2;
}
export function decisionSteps(document) {
    const at = sessionClock(document);
    return document.decisions.map((decision) => {
        const questionToDecision = at(decision.decided) - at(decision.question);
        const decisionToRelay = Math.max(0, at(decision.relayed) - at(decision.decided));
        const relayToDraft = Math.max(0, at(decision.drafted) - at(decision.relayed));
        return { decision, questionToDecision, decisionToRelay, relayToDraft, total: questionToDecision + decisionToRelay + relayToDraft };
    });
}
/** The headline figures, computed from the document rather than written by hand. */
export function sessionKpis(document, options = {}) {
    const at = sessionClock(document);
    const steps = decisionSteps(document);
    const lane = options.pullRequestLane ?? 'ci';
    const interruption = options.interruptionProtocol ?? 'ci.repair';
    const interrupted = options.interruptionLanes ?? ['design', 'orchestrator'];
    const pulls = document.episodes.filter((episode) => episode.lane === lane && !episode.approximate);
    const interruptions = document.episodes.filter((episode) => episode.protocol === interruption && interrupted.includes(episode.lane));
    const records = document.decisions.map((decision) => decision.adr).filter((adr) => /^\d+$/.test(adr)).sort();
    const others = document.decisions.filter((decision) => !/^\d+/.test(decision.adr)).map((decision) => decision.adr);
    const otherText = others.length ? ` and ${others.length === 2 ? 'two' : others.length} ${others[0]}${others.length > 1 ? 's' : ''}` : '';
    return [
        { label: 'Decisions', value: String(steps.length), detail: records.length ? `ADRs ${records[0]}–${records[records.length - 1]}${otherText}` : undefined },
        { label: 'Decision → draft', value: formatDuration(median(steps.map((step) => step.decisionToRelay + step.relayToDraft))), detail: 'median, relay plus drafting' },
        { label: 'Question → decision', value: formatDuration(median(steps.map((step) => step.questionToDecision))), detail: 'median, analysis plus reading' },
        { label: 'Pull requests merged', value: String(pulls.length), detail: `median open → merged ${formatDuration(median(pulls.map((episode) => at(episode.end) - at(episode.start))))}` },
        { label: 'Interruptions', value: formatDuration(interruptions.reduce((sum, episode) => sum + at(episode.end) - at(episode.start), 0)), detail: `${interruption} time in ${interrupted.length === 2 ? 'the two' : interrupted.length} sessions` },
    ];
}
