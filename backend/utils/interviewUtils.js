const EVALUATION_FIELDS = [
  'communicationLevel',
  'confidenceLevel',
  'clarityLevel',
  'clarityOfAnswer',
  'bodyLanguage',
  'overallHRLevel',
  'overallTechnicalLevel',
  'overallLevel',
  'technicalKnowledge',
  'problemSolving',
  'codingAbility',
  'logicAndApproach',
  'hrRemarks',
  'technicalRemarks',
  'remarks',
];

function hasInterviewEvaluation(interview) {
  if (!interview) return false;
  if (interview.status === 'Completed') return true;
  return EVALUATION_FIELDS.some((field) => Boolean(interview[field]));
}

function filterEvaluatedInterviews(interviews = []) {
  return interviews.filter(hasInterviewEvaluation);
}

function normalizeInterviewAttemptNumber(attemptNumber) {
  return String(attemptNumber ?? '').trim();
}

function getNextInterviewAttemptNumber(previousAttemptNumber) {
  const normalizedAttemptNumber = normalizeInterviewAttemptNumber(previousAttemptNumber);
  const match = normalizedAttemptNumber.match(/^(\d+)/);
  const currentAttemptNumber = match ? Number(match[1]) : 0;
  return String(currentAttemptNumber + 1);
}

module.exports = {
  hasInterviewEvaluation,
  filterEvaluatedInterviews,
  normalizeInterviewAttemptNumber,
  getNextInterviewAttemptNumber,
};
