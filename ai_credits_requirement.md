# AI Credits and Evaluation Requirement (v2)

## Prompt Specification
The evaluation prompt for Gemini should be:
```
You are an expert educational assistant evaluating a student's recall session.
The student is using the ${mode === 'feynman' ? 'Feynman Technique (explaining as if to a child)' : 'Blurt Method (recalling as much as possible)'}.

Original Note (Primary Source):
${originalText}

Student's Recall/Explanation:
${recallText}

Task:
Evaluate the student's recall based on the original note.
Provide a structured JSON response with the following keys:
- "summary": A brief comparison summary (2-3 sentences).
- "strengths": An array of specific strengths in their recall.
- "weaknesses": An array of specific weaknesses or missing points.
- "accuracy_score": A score from 0 to 10 (as a number).
- "learning_effectiveness_score": A score from 0 to 10 (as a number).
- "recommendation": A final actionable tip for the student.

Ensure the output is ONLY a valid JSON object.
```

## Token and Credit Rules (Deterministic)
The system MUST follow these exact steps for credit deduction:

1. **Calculate Raw Tokens**:
   - `inputTokensRaw = ceil(totalInputCharacters / 4)`
   - `outputTokensRaw = ceil(outputCharacters / 4)`
2. **Apply Margin of Error**:
   - `inputTokens = inputTokensRaw * 1.1`
   - `outputTokens = outputTokensRaw * 1.1`
3. **Calculate Costs**:
   - `inputCost = inputTokens / 2000`
   - `outputCost = outputTokens / 100`
   - `totalCost = inputCost + outputCost`
4. **Rounding**:
   - Store results with **4 decimal precision** in the database (`NUMERIC(10,4)`).
   - Display results with **2 decimal precision** in the UI.

## Security & Architecture Requirements
- **Authentication**: `uid` must **NOT** be passed in the request body. It must be derived from the authentication middleware (JWT/Session). Unauthorized requests return `401`.
- **Atomic Operations**: All credit updates must use DB transactions.
- **Concurrency**: Use row-level locking (`SELECT credits FROM users WHERE uid = $1 FOR UPDATE`) to prevent race conditions.
- **Reservation Logic**:
  - Before the AI call, estimated credits must be reserved (deducted initially).
  - If the AI call fails, the reserved credits must be rolled back (refunded).
  - If the AI call succeeds, any difference between estimated and actual cost must be adjusted.

## Storage & Display
- **Database**: `NUMERIC(10, 4)`.
- **UI**: Round to 2 decimals. Do not expose token math in the UI.
