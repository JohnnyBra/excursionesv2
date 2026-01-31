const { performance } = require('perf_hooks');

// Mock data generator
function generateClasses(count, startId = 0) {
    const classes = [];
    for (let i = 0; i < count; i++) {
        classes.push({
            id: `class-${startId + i}`,
            name: `Class ${startId + i}`,
            stage: 'ESO',
            cycle: '1',
            level: '1',
            cycleId: 'eso-1',
            tutorId: `tutor-${startId + i}`,
            extra: 'original-value'
        });
    }
    return classes;
}

function generateIncomingClasses(count, startId = 0) {
    const classes = [];
    for (let i = 0; i < count; i++) {
        classes.push({
            id: `class-${startId + i}`,
            name: `Class Updated ${startId + i}`, // Changed name
            stage: 'ESO',
            cycle: '1',
            level: '1',
            cycleId: 'eso-1',
            tutorId: `new-tutor-${startId + i}`,
            newProp: 'new-value'
        });
    }
    return classes;
}

// Current Implementation (O(N*M))
function currentImpl(currentDbClasses, prismaDataClasses) {
    // B) Clases
    const mergedClasses = [...currentDbClasses];
    prismaDataClasses.forEach(pc => {
        const idx = mergedClasses.findIndex(c => c.id === pc.id);
        if (idx === -1) {
            mergedClasses.push(pc);
        } else {
            mergedClasses[idx] = { ...mergedClasses[idx], ...pc };
        }
    });
    return mergedClasses;
}

// Optimized Implementation (O(N))
function optimizedImpl(currentDbClasses, prismaDataClasses) {
    // B) Clases
    // Initialize Map with current classes
    const classMap = new Map();
    currentDbClasses.forEach(c => classMap.set(c.id, c));

    // Process prisma classes
    prismaDataClasses.forEach(pc => {
        const existing = classMap.get(pc.id);
        if (existing) {
            // mergedClasses[idx] = { ...mergedClasses[idx], ...pc };
            classMap.set(pc.id, { ...existing, ...pc });
        } else {
            // mergedClasses.push(pc);
            classMap.set(pc.id, pc);
        }
    });

    // Return values as array
    return Array.from(classMap.values());
}

async function runBenchmark() {
    const N = 10000; // Existing classes
    const M = 5000;  // Incoming classes
    const OVERLAP = 2500; // Overlapping classes (updates)

    console.log(`Generating data: ${N} existing, ${M} incoming (${OVERLAP} updates, ${M - OVERLAP} new)...`);

    // 0 to 9999
    const currentClasses = generateClasses(N, 0);

    // Overlap: 7500 to 9999 (2500 items) + New: 10000 to 12499 (2500 items)
    const incomingClasses = [
        ...generateIncomingClasses(OVERLAP, N - OVERLAP),
        ...generateIncomingClasses(M - OVERLAP, N)
    ];

    console.log('Running Current Implementation (O(N*M))...');
    const start1 = performance.now();
    const res1 = currentImpl(currentClasses, incomingClasses);
    const end1 = performance.now();
    const time1 = (end1 - start1).toFixed(2);
    console.log(`Current: ${time1}ms`);

    console.log('Running Optimized Implementation (O(N))...');
    const start2 = performance.now();
    const res2 = optimizedImpl(currentClasses, incomingClasses);
    const end2 = performance.now();
    const time2 = (end2 - start2).toFixed(2);
    console.log(`Optimized: ${time2}ms`);

    // Verify Results
    console.log('Verifying results...');

    // Sort to ensure order doesn't affect comparison (Map iteration order is insertion order, but updates might change things effectively?
    // Actually Map preserves insertion order of keys. If we update, the key stays in place.
    // Array push adds to end.
    // Current impl: Updates stay in place, New adds to end.
    // Map impl: Updates stay in place, New adds to end.
    // So order should be identical! Let's check length first.)

    if (res1.length !== res2.length) {
        console.error(`❌ Length mismatch: Current=${res1.length}, Optimized=${res2.length}`);
        process.exit(1);
    }

    // Deep compare a random sample or all? JSON stringify all might be slow but safe.
    // Let's sort just to be absolutely sure we compare content.
    const sortFn = (a, b) => a.id.localeCompare(b.id);
    const json1 = JSON.stringify(res1.sort(sortFn));
    const json2 = JSON.stringify(res2.sort(sortFn));

    if (json1 === json2) {
        console.log('✅ Results match perfectly!');
        console.log(`🚀 Speedup: ${(time1 / time2).toFixed(1)}x`);
    } else {
        console.error('❌ Content mismatch!');
        // Find first difference
        for(let i=0; i<res1.length; i++) {
            if (JSON.stringify(res1[i]) !== JSON.stringify(res2[i])) {
                console.log('Diff at index', i);
                console.log('Current:', res1[i]);
                console.log('Optimized:', res2[i]);
                break;
            }
        }
        process.exit(1);
    }
}

runBenchmark();
