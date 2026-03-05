/**
 * @name Assignment to innerHTML
 * @description Assigning to innerHTML can introduce XSS risk if any untrusted content reaches the sink.
 * @kind problem
 * @problem.severity warning
 * @precision medium
 * @id js/custom/innerhtml-assignment
 * @tags security
 *       external/cwe/cwe-079
 */

import javascript

private predicate inUserSource(AssignExpr assign) {
  not assign.getTopLevel().getFile().getRelativePath().regexpMatch("(^|.*/)(test|tests|__tests__|mocks?)/.*")
}

from AssignExpr assign, PropAccess lhs
where
  inUserSource(assign) and
  lhs = assign.getLhs() and
  lhs.getPropertyName() = "innerHTML"
select assign,
  "Assignment to innerHTML can be unsafe. Prefer textContent or sanitization before rendering HTML."
