/**
 * @name github-script step without toJson hardening
 * @description Inline scripts passed to actions/github-script should use toJson when handling expression values.
 * @kind problem
 * @problem.severity recommendation
 * @precision medium
 * @id actions/custom/github-script-without-tojson
 * @tags actions
 *       security
 *       external/cwe/cwe-116
 */

import actions

from UsesStep step
where step.getCallee() = "actions/github-script"
select step,
  "Review this github-script step for safe interpolation, validation, and least-privilege token use."
