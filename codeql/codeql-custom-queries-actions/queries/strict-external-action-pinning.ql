/**
 * @name Uses step not pinned to a full commit SHA
 * @description Detects workflow/action `uses:` steps that are not pinned to a 40-character commit SHA.
 * @kind problem
 * @problem.severity warning
 * @precision high
 * @id actions/custom/strict-external-action-pinning
 * @tags actions
 *       security
 *       external/cwe/cwe-829
 */

import actions

from UsesStep uses
where not uses.getVersion().regexpMatch("^[A-Fa-f0-9]{40}$")
select uses,
  "Action version is not pinned to a full commit SHA; review and pin to an immutable revision."
