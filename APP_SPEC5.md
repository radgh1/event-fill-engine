Fix inconsistency between projection and campaign status.

If projectedHigh >= attendanceGoal:
- Campaign Status should not say "Needs More Leads"
- It should say "On Track" or "Above Target"

Only show "Needs More Leads" if projectedHigh < attendanceGoal.

Ensure projection, required leads, and status logic are aligned.