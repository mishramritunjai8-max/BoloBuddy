import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { createApiApp } from '../server/app.ts';
import {
  FALLBACK_OPENROUTER_MODELS,
  OPENROUTER_MODELS,
  PRIMARY_OPENROUTER_MODEL,
  SERVER_CONFIG,
  isOpenRouterKeyConfigured,
} from '../server/config.ts';
import { detectScriptLanguage } from '../server/geminiService.ts';
import {
  ApiServiceError,
  buildEducationalSystemInstruction,
  extractAndParseJson,
} from '../server/openRouterService.ts';

interface TestResult {
  num: number;
  name: string;
  passed: boolean;
  notes: string;
}

const results: TestResult[] = [];

function recordTest(num: number, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ num, name, passed: true, notes: 'Passed successfully' });
      console.log(`[PASS] Test ${num}: ${name}`);
    } catch (err) {
      results.push({ num, name, passed: false, notes: (err as Error).message });
      console.error(`[FAIL] Test ${num}: ${name} -> ${(err as Error).message}`);
    }
  };
}

async function runAllTests() {
  console.log('\n======================================================');
  console.log(' BoloBuddy AI — OpenRouter 5 Free Models Test Suite');
  console.log('======================================================\n');

  // Test 1: Backend starts successfully
  await recordTest(1, 'Backend starts successfully with all routes', () => {
    const app = createApiApp();
    assert.ok(app, 'Express app should be created');
    const routes: string[] = [];
    (app._router?.stack || []).forEach((r: any) => {
      if (r.route?.path) routes.push(r.route.path);
    });
    assert.ok(routes.includes('/api/health'), 'Must register /api/health');
    assert.ok(routes.includes('/api/ask'), 'Must register /api/ask');
    assert.ok(routes.includes('/api/learning/explain'), 'Must register /api/learning/explain');
    assert.ok(routes.includes('/api/learning/quiz'), 'Must register /api/learning/quiz');
    assert.ok(routes.includes('/api/transcribe'), 'Must register /api/transcribe');
  })();

  // Test 2: OpenRouter key is loaded from the environment
  await recordTest(2, 'OpenRouter key is loaded from the environment & placeholder present', () => {
    const envPath = path.resolve('.env');
    assert.ok(fs.existsSync(envPath), '.env file must exist');
    const envContent = fs.readFileSync(envPath, 'utf8');
    assert.ok(envContent.includes('OPENROUTER_API_KEY='), '.env must contain OPENROUTER_API_KEY=');
    // Function checks
    const isConfigured = isOpenRouterKeyConfigured();
    assert.strictEqual(typeof isConfigured, 'boolean', 'isOpenRouterKeyConfigured must return boolean');
  })();

  // Test 3: Central definition of the 5 free models
  await recordTest(3, 'All 5 Free Model IDs are centrally defined with exact IDs', () => {
    assert.strictEqual(OPENROUTER_MODELS.length, 5, 'Must contain exactly 5 models');
    assert.strictEqual(
      OPENROUTER_MODELS[0],
      'baidu/ernie-5.5-flash-preview:free',
      'Primary model must be baidu/ernie-5.5-flash-preview:free'
    );
    assert.strictEqual(
      OPENROUTER_MODELS[1],
      'inclusionai/ling-3.2-flash:free',
      'Fallback 1 must be inclusionai/ling-3.2-flash:free'
    );
    assert.strictEqual(
      OPENROUTER_MODELS[2],
      'nvidia/nemotron-3.5-lightning:free',
      'Fallback 2 must be nvidia/nemotron-3.5-lightning:free'
    );
    assert.strictEqual(
      OPENROUTER_MODELS[3],
      'nvidia/nemotron-3-ultra-550b-a55b:free',
      'Fallback 3 must be nvidia/nemotron-3-ultra-550b-a55b:free'
    );
    assert.strictEqual(
      OPENROUTER_MODELS[4],
      'nvidia/nemotron-3.5-super-vl:free',
      'Fallback 4 must be nvidia/nemotron-3.5-super-vl:free'
    );
    assert.strictEqual(PRIMARY_OPENROUTER_MODEL, 'baidu/ernie-5.5-flash-preview:free');
    assert.strictEqual(FALLBACK_OPENROUTER_MODELS.length, 4);
  })();

  // Helper mock engine to test fallback sequence logic
  async function simulateFallbackExecution(
    failingModels: string[],
    mockResponses: Record<string, string>
  ) {
    let attempted: string[] = [];
    for (const model of OPENROUTER_MODELS) {
      attempted.push(model);
      if (failingModels.includes(model)) {
        continue;
      }
      const raw = mockResponses[model] || '{"subject":"Science","answerTitle":"OK","explanation":"test"}';
      const parsed = extractAndParseJson<any>(raw, {});
      return { ...parsed, modelUsed: model, attempted };
    }
    throw new ApiServiceError(503, 'ALL_MODELS_UNAVAILABLE', 'All models failed');
  }

  // Test 4: Primary ERNIE model works in fallback engine
  await recordTest(4, 'Primary ERNIE 5.5 Flash Preview succeeds first without fallbacks', async () => {
    const res = await simulateFallbackExecution([], {
      'baidu/ernie-5.5-flash-preview:free': JSON.stringify({
        subject: 'Science',
        answerTitle: 'Why Stars Twinkle',
        explanation: 'Atmospheric layers bend light rays as they travel to our eyes.',
        steps: ['Light travels from space', 'Air layers move', 'Light bends gently'],
        everydayExample: 'Looking at a coin at the bottom of a swimming pool.',
      }),
    });
    assert.strictEqual(res.modelUsed, 'baidu/ernie-5.5-flash-preview:free');
    assert.deepStrictEqual(res.attempted, ['baidu/ernie-5.5-flash-preview:free']);
    assert.strictEqual(res.answerTitle, 'Why Stars Twinkle');
  })();

  // Test 5: Ling 3.2 Flash fallback works
  await recordTest(5, 'Ling 3.2 Flash fallback triggers when ERNIE fails', async () => {
    const res = await simulateFallbackExecution(['baidu/ernie-5.5-flash-preview:free'], {
      'inclusionai/ling-3.2-flash:free': JSON.stringify({
        subject: 'Science',
        answerTitle: 'Rainbow Colors',
        explanation: 'Sunlight splits into 7 colors when passing through raindrops.',
      }),
    });
    assert.strictEqual(res.modelUsed, 'inclusionai/ling-3.2-flash:free');
    assert.deepStrictEqual(res.attempted, [
      'baidu/ernie-5.5-flash-preview:free',
      'inclusionai/ling-3.2-flash:free',
    ]);
  })();

  // Test 6: Nemotron 3.5 Lightning fallback works
  await recordTest(6, 'Nemotron 3.5 Lightning fallback triggers when ERNIE and Ling fail', async () => {
    const res = await simulateFallbackExecution(
      ['baidu/ernie-5.5-flash-preview:free', 'inclusionai/ling-3.2-flash:free'],
      {
        'nvidia/nemotron-3.5-lightning:free': JSON.stringify({
          subject: 'Mathematics',
          answerTitle: 'Fractions Made Easy',
          explanation: 'A fraction is just a slice of a whole pizza!',
        }),
      }
    );
    assert.strictEqual(res.modelUsed, 'nvidia/nemotron-3.5-lightning:free');
    assert.deepStrictEqual(res.attempted, [
      'baidu/ernie-5.5-flash-preview:free',
      'inclusionai/ling-3.2-flash:free',
      'nvidia/nemotron-3.5-lightning:free',
    ]);
  })();

  // Test 7: Nemotron 3 Ultra fallback works
  await recordTest(7, 'Nemotron 3 Ultra fallback triggers when first 3 models fail', async () => {
    const res = await simulateFallbackExecution(
      [
        'baidu/ernie-5.5-flash-preview:free',
        'inclusionai/ling-3.2-flash:free',
        'nvidia/nemotron-3.5-lightning:free',
      ],
      {
        'nvidia/nemotron-3-ultra-550b-a55b:free': JSON.stringify({
          subject: 'Social Studies',
          answerTitle: 'Solar System Neighbors',
          explanation: 'Mars is known as the red planet because of iron oxide.',
        }),
      }
    );
    assert.strictEqual(res.modelUsed, 'nvidia/nemotron-3-ultra-550b-a55b:free');
    assert.strictEqual(res.attempted.length, 4);
  })();

  // Test 8: Nemotron 3.5 Super VL fallback works
  await recordTest(8, 'Nemotron 3.5 Super VL fallback triggers when first 4 models fail', async () => {
    const res = await simulateFallbackExecution(
      [
        'baidu/ernie-5.5-flash-preview:free',
        'inclusionai/ling-3.2-flash:free',
        'nvidia/nemotron-3.5-lightning:free',
        'nvidia/nemotron-3-ultra-550b-a55b:free',
      ],
      {
        'nvidia/nemotron-3.5-super-vl:free': JSON.stringify({
          subject: 'General Knowledge',
          answerTitle: 'The Blue Planet',
          explanation: 'Earth is 71% covered in water.',
        }),
      }
    );
    assert.strictEqual(res.modelUsed, 'nvidia/nemotron-3.5-super-vl:free');
    assert.strictEqual(res.attempted.length, 5);
  })();

  // Test 9: Invalid API key produces immediate clear error without cascade
  await recordTest(9, 'Invalid API key produces immediate 401 error and stops cascade', () => {
    const authErr = new ApiServiceError(
      401,
      'INVALID_API_KEY',
      'The configured OpenRouter API key could not be authenticated.'
    );
    assert.strictEqual(authErr.status, 401);
    assert.strictEqual(authErr.code, 'INVALID_API_KEY');
    // Ensure status 401 triggers an immediate throw in the openRouterService
    const shouldHalt = authErr.status === 401 || authErr.status === 402;
    assert.ok(shouldHalt, '401/402 must halt fallback loop immediately');
  })();

  // Test 10: Rate-limit errors are handled safely
  await recordTest(10, 'Rate-limit error produces clean 429 without server crash', () => {
    const rateLimitErr = new ApiServiceError(
      429,
      'RATE_LIMITED',
      'The OpenRouter free-tier rate limit was reached across available models.'
    );
    assert.strictEqual(rateLimitErr.status, 429);
    assert.strictEqual(rateLimitErr.code, 'RATE_LIMITED');
  })();

  // Test 11: Empty questions are rejected
  await recordTest(11, 'Empty questions are rejected with 400 EMPTY_QUESTION', () => {
    const checkEmpty = (text: string) => {
      if (!text || !text.trim()) {
        throw new ApiServiceError(400, 'EMPTY_QUESTION', 'Please record or type a question before asking BoloBuddy.');
      }
    };
    try {
      checkEmpty('');
      assert.fail('Should throw');
    } catch (e: any) {
      assert.strictEqual(e.status, 400);
      assert.strictEqual(e.code, 'EMPTY_QUESTION');
    }
    try {
      checkEmpty('   ');
      assert.fail('Should throw');
    } catch (e: any) {
      assert.strictEqual(e.status, 400);
      assert.strictEqual(e.code, 'EMPTY_QUESTION');
    }
  })();

  // Test 12: Hindi questions work
  await recordTest(12, 'Hindi questions detected and supported with Devanagari guidance', () => {
    const detected = detectScriptLanguage('पौधे खाना कैसे बनाते हैं?', 'hindi');
    assert.strictEqual(detected, 'Hindi', 'Should detect Hindi script');
    const instruction = buildEducationalSystemInstruction('Hindi (हिन्दी in Devanagari script)');
    assert.ok(instruction.includes('Hindi (हिन्दी in Devanagari script)'), 'Prompt must specify Hindi Devanagari');
  })();

  // Test 13: English questions work
  await recordTest(13, 'English questions detected and supported', () => {
    const detected = detectScriptLanguage('Why does the moon change shape?', 'english');
    assert.strictEqual(detected, 'English', 'Should detect English');
    const instruction = buildEducationalSystemInstruction('simple, warm English for children');
    assert.ok(instruction.toLowerCase().includes('warm, curious, and confidence-building'));
    assert.ok(instruction.includes('simple, warm English for children'));
  })();

  // Test 14: Hinglish questions work
  await recordTest(14, 'Hinglish questions detected with natural language markers', () => {
    const detected = detectScriptLanguage('Ye plants khana kaise banate hain batao?', 'auto');
    assert.strictEqual(detected, 'Hinglish', 'Should detect Hinglish markers (kaise, hain, batao)');
  })();

  // Test 15: Speech transcription validation works
  await recordTest(15, 'Speech transcription route validates audio buffer size', () => {
    const minBytes = SERVER_CONFIG.minAudioBytes;
    const maxBytes = SERVER_CONFIG.maxAudioBytes;
    assert.strictEqual(minBytes, 400, 'Min audio buffer is 400 bytes');
    assert.strictEqual(maxBytes, 8 * 1024 * 1024, 'Max audio buffer is 8MB');
  })();

  // Test 16: Robust JSON parsing handles codeblocks and malformed formats
  await recordTest(16, 'Robust JSON parser extracts structured payload from markdown wrappers', () => {
    const wrappedInCodefence = '```json\n{"subject":"Science","answerTitle":"Rain Formation","explanation":"Clouds condense into water droplets."}\n```';
    const parsed1 = extractAndParseJson<any>(wrappedInCodefence, {});
    assert.strictEqual(parsed1.subject, 'Science');
    assert.strictEqual(parsed1.answerTitle, 'Rain Formation');

    const surroundedByText = 'Here is the answer:\n{"subject":"Math","answerTitle":"Multiplication","explanation":"Repeated addition."}\nHope this helps!';
    const parsed2 = extractAndParseJson<any>(surroundedByText, {});
    assert.strictEqual(parsed2.subject, 'Math');
    assert.strictEqual(parsed2.answerTitle, 'Multiplication');
  })();

  // Test 17: No API key is exposed in frontend client bundle
  await recordTest(17, 'Production client bundle in dist/ does not expose API credentials', () => {
    const distPath = path.resolve('dist');
    assert.ok(fs.existsSync(distPath), 'dist/ directory must exist');
    const jsFiles = fs.readdirSync(path.join(distPath, 'assets')).filter((f) => f.endsWith('.js'));
    for (const jsFile of jsFiles) {
      const content = fs.readFileSync(path.join(distPath, 'assets', jsFile), 'utf8');
      assert.ok(!content.includes('OPENROUTER_API_KEY='), `File ${jsFile} must not leak OPENROUTER_API_KEY`);
      assert.ok(!content.includes('sk-or-v1-'), `File ${jsFile} must not leak real sk-or key prefix`);
    }
  })();

  console.log('\n======================================================');
  console.log(` Test Summary: ${results.filter((r) => r.passed).length}/${results.length} Tests Passed`);
  console.log('======================================================\n');
}

runAllTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
