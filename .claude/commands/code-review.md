---
allowed-tools: Read(*)
description: Perform a code-review
---

Mode: $ARGUMENTS

If mode is one of the following, adjust the review as described:
- MODE === BUGS: Focus on identifying potential bugs and issues in the code.
- MODE === SECURITY: Focus on identifying potential security vulnerabilities.
- MODE === PERFORMANCE: Focus on identifying potential performance bottlenecks and inefficiencies.
- MODE === ALL run a comprehensive review covering all of the above aspects.

MODE can also be a combination of the above, in which case you should adjust the review to cover all specified aspects.
Offer to user select one or more options before starting the review like this:
Please specify the mode(s) for the code review: BUGS, SECURITY, PERFORMANCE, ALL

If MODE is not specified, offer a list of the above modes and ask the user to choose one or more before proceeding with the review.

Perform an in-depth code review based on the specified mode(s), providing detailed feedback and suggestions for improvement. Be sure to highlight any critical issues and provide actionable recommendations for addressing them.
Use context7 if it is available, otherwise ask the user to provide documentation or additional information

Create a detailed report summarizing your findings, including any identified issues, potential risks, and recommended actions for improvement. The report should be clear and concise, making it easy for the user to understand the key points and take appropriate action.