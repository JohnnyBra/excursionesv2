const { performance } = require('perf_hooks');

// Mock Data Generators
function generateUsers(count, classCount) {
    const users = [];
    for (let i = 0; i < count; i++) {
        users.push({
            id: `user-${i}`,
            name: `User ${i}`,
            classId: `class-${i % classCount}`, // Distribute users across classes
            role: 'TUTOR'
        });
    }
    return users;
}

function generateClasses(count) {
    const classes = [];
    for (let i = 0; i < count; i++) {
        classes.push({
            id: `class-${i}`,
            name: `Class ${i}`,
            tutorId: ''
        });
    }
    return classes;
}

// Current Implementation (O(N*M))
function currentImplementation(users, classes) {
    // Clone to avoid mutating original for fair comparison
    const usersCopy = JSON.parse(JSON.stringify(users));
    const classesCopy = JSON.parse(JSON.stringify(classes));

    const start = performance.now();
    usersCopy.forEach(u => {
        if (u.classId) {
            const cls = classesCopy.find(c => c.id === u.classId);
            if (cls) cls.tutorId = u.id;
        }
    });
    const end = performance.now();
    return { time: end - start, result: classesCopy };
}

// Optimized Implementation (O(N + M))
function optimizedImplementation(users, classes) {
    // Clone to avoid mutating original for fair comparison
    const usersCopy = JSON.parse(JSON.stringify(users));
    const classesCopy = JSON.parse(JSON.stringify(classes));

    const start = performance.now();

    // Create Map of classes
    const classMap = new Map();
    classesCopy.forEach(c => classMap.set(c.id, c));

    usersCopy.forEach(u => {
        if (u.classId) {
            const cls = classMap.get(u.classId);
            if (cls) cls.tutorId = u.id;
        }
    });

    // Convert back to array if needed, but here we just modified objects in place (in the copy)
    // The classesCopy array already holds references to the modified objects.

    const end = performance.now();
    return { time: end - start, result: classesCopy };
}

function runBenchmark() {
    const USER_COUNT = 10000;
    const CLASS_COUNT = 1000;

    console.log(`Generating data: ${USER_COUNT} users, ${CLASS_COUNT} classes...`);
    const users = generateUsers(USER_COUNT, CLASS_COUNT);
    const classes = generateClasses(CLASS_COUNT);

    console.log('Running Current Implementation...');
    const current = currentImplementation(users, classes);
    console.log(`Current Time: ${current.time.toFixed(4)} ms`);

    console.log('Running Optimized Implementation...');
    const optimized = optimizedImplementation(users, classes);
    console.log(`Optimized Time: ${optimized.time.toFixed(4)} ms`);

    // Verify Correctness
    const currentJson = JSON.stringify(current.result);
    const optimizedJson = JSON.stringify(optimized.result);

    if (currentJson === optimizedJson) {
        console.log('✅ Results match!');
        console.log(`🚀 Speedup: ${(current.time / optimized.time).toFixed(2)}x`);
    } else {
        console.error('❌ Results do not match!');
        process.exit(1);
    }
}

runBenchmark();
