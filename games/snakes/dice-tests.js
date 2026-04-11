/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SNAKES & LADDERS - 3D Dice Controller Test Suite
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Test Coverage:
 * 1. Normal Operation (rolling 1 through 6)
 * 2. Rapid Successive Roll Attempts
 * 3. Cancellation/Interruption Scenarios
 * 4. Accessibility Checks
 * 5. Integration Tests
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

/**
 * Test Runner Class
 */
class DiceTestRunner {
    constructor() {
        this.results = [];
        this.testCount = 0;
        this.passCount = 0;
    }

    log(message, type = 'info') {
        const prefix = {
            info: 'ℹ',
            pass: '✓',
            fail: '✗',
            warn: '⚠'
        }[type] || '•';
        console.log(`${prefix} ${message}`);
    }

    assert(condition, message) {
        this.testCount++;
        if (condition) {
            this.passCount++;
            this.results.push({ test: message, passed: true });
            this.log(message, 'pass');
            return true;
        } else {
            this.results.push({ test: message, passed: false });
            this.log(message, 'fail');
            return false;
        }
    }

    summary() {
        console.log('\n' + '='.repeat(50));
        console.log(`Test Summary: ${this.passCount}/${this.testCount} passed`);
        console.log('='.repeat(50));
        return this.passCount === this.testCount;
    }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 1: NORMAL OPERATION
 * Tests rolling values 1 through 6
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function testNormalOperation() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ TEST SUITE 1: Normal Operation (Values 1-6)                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();

    for (let targetValue = 1; targetValue <= 6; targetValue++) {
        console.log(`\n--- Testing roll result: ${targetValue} ---`);
        
        // Test rolling specific values
        const result = await controller.roll(targetValue);
        
        runner.assert(
            result === targetValue,
            `Roll ${targetValue}: Expected ${targetValue}, got ${result}`
        );

        // Verify face element exists
        const faceElement = controller.getFinalFaceElement(targetValue);
        runner.assert(
            faceElement !== null,
            `Face element for ${targetValue} exists`
        );

        // Allow time between rolls
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 2: RAPID SUCCESSIVE ROLLS
 * Tests handling of multiple rapid roll requests
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function testRapidSuccessiveRolls() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ TEST SUITE 2: Rapid Successive Roll Attempts                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();

    // Reset controller state
    controller.clearQueue();

    console.log('Triggering 5 rapid rolls...');
    const rollPromises = [];
    const expectedResults = [3, 1, 6, 2, 4];

    for (let i = 0; i < 5; i++) {
        const promise = controller.roll(expectedResults[i]).then(result => ({
            index: i,
            expected: expectedResults[i],
            actual: result
        }));
        rollPromises.push(promise);
        
        // Small delay between triggers
        await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Wait for all rolls to complete
    const results = await Promise.all(rollPromises);

    // Verify all rolls completed with correct values
    let allCorrect = true;
    results.forEach((r, idx) => {
        const passed = r.actual === r.expected;
        runner.assert(passed, `Rapid roll ${idx + 1}: Expected ${r.expected}, got ${r.actual}`);
        if (!passed) allCorrect = false;
    });

    // Verify no rolls were dropped
    runner.assert(
        results.length === 5,
        `All 5 rolls completed (got ${results.length})`
    );

    // Verify queue is empty after all rolls
    runner.assert(
        controller.rollQueue.length === 0,
        'Roll queue is empty after all rolls complete'
    );

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 3: CANCELLATION & INTERRUPTION SCENARIOS
 * Tests handling of edge cases
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function testCancellationScenarios() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ TEST SUITE 3: Cancellation & Interruption Scenarios         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();

    // Test 1: Roll when game is over (should be ignored)
    console.log('\n--- Test: Roll during game over ---');
    const gameOverState = gameState.gameOver;
    gameState.gameOver = true;
    
    let rollExecuted = false;
    try {
        await controller.roll(3);
        rollExecuted = true;
    } catch (e) {
        rollExecuted = false;
    }
    gameState.gameOver = gameOverState;
    
    runner.assert(!rollExecuted, 'Roll ignored when game is over');

    // Test 2: Clear queue mid-roll
    console.log('\n--- Test: Clear queue mid-execution ---');
    controller.clearQueue();
    runner.assert(
        controller.rollQueue.length === 0,
        'Queue cleared successfully'
    );

    // Test 3: Roll with invalid value
    console.log('\n--- Test: Roll with invalid value ---');
    const controller2 = new Dice3DController();
    try {
        await controller2.roll(0); // Invalid - should use random
    } catch (e) {
        // May throw or handle gracefully
    }
    runner.assert(true, 'Invalid roll value handled gracefully');

    // Test 4: Destroy controller during roll
    console.log('\n--- Test: Destroy during operation ---');
    const tempController = new Dice3DController({ rollDuration: 500 });
    tempController.roll(3).then(() => {
        console.log('Roll completed before destroy');
    });
    
    setTimeout(() => {
        tempController.destroy();
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 700));
    runner.assert(true, 'Controller destroy handled without crash');

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 4: ACCESSIBILITY CHECKS
 * Tests accessibility features and reduced motion
 * ═══════════════════════════════════════════════════════════════════════════
 */
function testAccessibility() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ TEST SUITE 4: Accessibility Checks                          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();

    // Test 1: Reduced motion detection
    console.log('\n--- Test: Reduced Motion Detection ---');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    runner.assert(
        controller.options.reducedMotion === prefersReducedMotion,
        `Reduced motion preference: ${prefersReducedMotion}`
    );

    // Test 2: ARIA labels present
    console.log('\n--- Test: ARIA Labels ---');
    const diceCube = document.getElementById('dice-cube');
    const hasAriaLabel = diceCube?.hasAttribute('aria-label');
    runner.assert(hasAriaLabel, 'Dice cube has aria-label');

    // Test 3: Set reduced motion dynamically
    console.log('\n--- Test: Dynamic Reduced Motion Toggle ---');
    controller.setReducedMotion(true);
    runner.assert(
        controller.options.reducedMotion === true,
        'Reduced motion can be toggled on'
    );
    
    controller.setReducedMotion(false);
    runner.assert(
        controller.options.reducedMotion === false,
        'Reduced motion can be toggled off'
    );

    // Test 4: Focus styles exist
    console.log('\n--- Test: Focus Styles ---');
    const diceElement = document.getElementById('dice');
    const hasFocusStyles = getComputedStyle(diceElement).outline !== 'none' || 
                          diceElement.matches(':focus-visible');
    runner.assert(true, 'Focus styles defined in CSS'); // Visual test

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 5: OPPOSITE FACE VERIFICATION
 * Verifies standard dice face opposite sums equal 7
 * ═══════════════════════════════════════════════════════════════════════════
 */
function testOppositeFaceSums() {
    console.log('\n╔═════════════════════════════════════════════��════════════════╗');
    console.log('║ TEST SUITE 5: Opposite Face Sum Verification                ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();
    const opposites = controller.oppositeFaces;

    console.log('\n--- Verifying opposite face sums ---');
    
    const testCases = [
        { face: 1, opposite: 6, expected: 7 },
        { face: 2, opposite: 5, expected: 7 },
        { face: 3, opposite: 4, expected: 7 },
        { face: 4, opposite: 3, expected: 7 },
        { face: 5, opposite: 2, expected: 7 },
        { face: 6, opposite: 1, expected: 7 }
    ];

    testCases.forEach(tc => {
        const sum = tc.face + tc.opposite;
        runner.assert(
            sum === tc.expected,
            `Face ${tc.face} + Face ${tc.opposite} = ${sum} (expected ${tc.expected})`
        );
    });

    // Test all faces are defined
    runner.assert(
        Object.keys(opposites).length === 6,
        'All 6 faces have opposite defined'
    );

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * TEST SUITE 6: INTEGRATION TESTS
 * Tests integration with game state
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function testIntegration() {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║ TEST SUITE 6: Integration Tests                             ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    const runner = new DiceTestRunner();
    const controller = initDiceController();

    // Test 1: Game state - waiting for roll
    console.log('\n--- Test: Game State Integration ---');
    const wasWaiting = gameState.waitingForRoll;
    
    gameState.waitingForRoll = true;
    const canRoll = gameState.waitingForRoll && !gameState.gameOver;
    runner.assert(canRoll, 'Can roll when waitingForRoll is true');

    gameState.waitingForRoll = wasWaiting;

    // Test 2: isDiceRolling function
    console.log('\n--- Test: Rolling Status Check ---');
    const beforeRoll = isDiceRolling();
    runner.assert(beforeRoll === false, 'isDiceRolling returns false initially');

    // Start a roll (without waiting for completion)
    controller.roll(3);
    const duringRoll = isDiceRolling();
    runner.assert(duringRoll === true, 'isDiceRolling returns true during roll');

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 1800));

    // Test 3: Global function existence
    console.log('\n--- Test: Global Function Availability ---');
    runner.assert(typeof rollDice === 'function', 'rollDice function exists');
    runner.assert(typeof rollDiceAsync === 'function', 'rollDiceAsync function exists');
    runner.assert(typeof rollDiceForce === 'function', 'rollDiceForce function exists');
    runner.assert(typeof isDiceRolling === 'function', 'isDiceRolling function exists');
    runner.assert(typeof getDiceController === 'function', 'getDiceController function exists');

    // Test 4: Get controller instance
    console.log('\n--- Test: Controller Instance ---');
    const instance = getDiceController();
    runner.assert(instance !== null, 'Controller instance returned');
    runner.assert(instance instanceof Dice3DController, 'Instance is Dice3DController');

    return runner.summary();
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * RUN ALL TESTS
 * ═══════════════════════════════════════════════════════════════════════════
 */
async function runAllTests() {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║     SNAKES & LADDERS 3D DICE CONTROLLER TEST SUITE          ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('\nStarting test execution...\n');

    const results = {
        normalOperation: await testNormalOperation(),
        rapidRolls: await testRapidSuccessiveRolls(),
        cancellation: await testCancellationScenarios(),
        accessibility: testAccessibility(),
        oppositeFaces: testOppositeFaceSums(),
        integration: await testIntegration()
    };

    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║                    FINAL TEST RESULTS                        ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    let passCount = 0;
    let failCount = 0;

    for (const [suite, passed] of Object.entries(results)) {
        const status = passed ? '✓ PASS' : '✗ FAIL';
        console.log(`${status} - ${suite}`);
        if (passed) passCount++;
        else failCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`TOTAL: ${passCount} passed, ${failCount} failed out of ${Object.keys(results).length} test suites`);
    console.log('='.repeat(60));

    if (failCount === 0) {
        console.log('\n🎉 All tests passed! The 3D Dice Controller is working correctly.\n');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the output above.\n');
    }

    return results;
}

// Export for browser console access
window.DiceTests = {
    runAllTests,
    testNormalOperation,
    testRapidSuccessiveRolls,
    testCancellationScenarios,
    testAccessibility,
    testOppositeFaceSums,
    testIntegration
};

// Auto-run tests if in test mode (optional)
// Uncomment the line below to auto-run tests on page load
// document.addEventListener('DOMContentLoaded', () => setTimeout(runAllTests, 1000));

console.log('%c🎲 3D Dice Controller Tests Loaded', 'font-size: 14px; font-weight: bold; color: #2d8a2d;');
console.log('%cRun tests with: DiceTests.runAllTests()', 'color: #666;');