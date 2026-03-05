/**
 * @name Use of shell-based child_process APIs
 * @description Calls to exec/execSync run through a shell and are riskier than argument-array alternatives.
 * @kind problem
 * @problem.severity warning
 * @precision high
 * @id js/custom/child-process-shell-apis
 * @tags security
 *       external/cwe/cwe-078
 */

import javascript

private predicate inUserSource(InvokeExpr call) {
  not call.getTopLevel().getFile().getRelativePath().regexpMatch("(^|.*/)(test|tests|__tests__|mocks?)/.*")
}

from CallExpr call
where
  inUserSource(call) and
  not call.getCallee() instanceof PropAccess and
  call.getCalleeName() = ["exec", "execSync"]
select call,
  "Shell-based process execution ($@) is harder to secure. Prefer execFile/spawn with argument arrays and strict input validation.",
  call,
  call.getCalleeName()
