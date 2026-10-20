// lib/utils/student/help/fallbackFaqs.ts
// Shortened fallback FAQ list (10 items, exam-system focused).
// Used when the `help_faqs` table is empty or unavailable.

import type { FaqItem } from '@/lib/types/student/help/faq.types'

export const FALLBACK_FAQS: FaqItem[] = [
  {
    id: '1', category: 'taking',
    question: 'How do I start a mock board exam?',
    answer:
      'Go to Mock Exams in the sidebar. Find the exam for your degree program — if its status is Available, click Start Exam. An instructions screen appears before the timer begins. Ensure a stable internet connection and sufficient time before starting, as leaving mid-exam may count as a submission.',
  },
  {
    id: '2', category: 'taking',
    question: 'Can I pause or save my progress mid-exam?',
    answer:
      'No. Once you start, the countdown timer runs continuously — even if you close the browser. Exams simulate actual PRC board exam conditions and cannot be paused. If your connection drops, answers saved up to that point may be retained; contact support if you believe your session was cut short unfairly.',
  },
  {
    id: '3', category: 'taking',
    question: 'Can I go back and change answers before submitting?',
    answer:
      'Yes. Navigate freely between questions using the question navigator panel. Answered items are highlighted. Review all flagged or skipped items before clicking Submit Exam. Once submitted, answers are final.',
  },
  {
    id: '4', category: 'results',
    question: 'Where can I view my exam results and scores?',
    answer:
      'After submitting, your score appears immediately on the Results screen. Access all past results anytime via Results in the sidebar — each entry shows score, percentage, time taken, and a subject-area breakdown.',
  },
  {
    id: '5', category: 'results',
    question: 'Can I review which questions I got wrong after submitting?',
    answer:
      'Yes. On the Results page, click Review Answers next to any completed exam to see each question, your answer, the correct answer, and a brief rationale. Use this to identify weak areas and focus your reviewer sessions.',
  },
  {
    id: '6', category: 'reviewers',
    question: 'What is the difference between a Reviewer and a Mock Exam?',
    answer:
      'A Reviewer is untimed and practice-mode — you answer at your own pace with instant per-item feedback. A Mock Exam is timed and simulates actual board exam conditions to assess readiness under pressure.',
  },
  {
    id: '7', category: 'timing',
    question: 'What happens when the exam timer reaches zero?',
    answer:
      'The exam is automatically submitted with all answers marked up to that point. Unanswered items are scored as incorrect. You are taken directly to the Results screen — there is no grace period.',
  },
  {
    id: '8', category: 'programs',
    question: 'Which degree programs currently have available mock exams?',
    answer:
      'Currently active programs: BLIS, BSPsych, BSArch, BSID, BEEd, BSEd-English, BSEd-Filipino, BSEd-Science, and BSEd-Mathematics. Other programs show "Coming Soon" and will be activated once exams are assigned by your admin.',
  },
  {
    id: '9', category: 'account',
    question: 'How do I reset my password?',
    answer:
      'On the login page, click Forgot Password and enter your registered email. A reset link arrives within a few minutes — check your spam folder if you do not receive it. For locked accounts, contact the support team directly.',
  },
  {
    id: '10', category: 'technical',
    question: 'The exam page is not loading or shows a blank screen. What should I do?',
    answer:
      'Hard refresh the page (Ctrl+Shift+R / Cmd+Shift+R), clear your browser cache, and try again. Use Chrome 110+, Firefox 115+, or Edge. Disable extensions that may block scripts. If the issue persists, note any error message and contact support before starting another session.',
  },
]