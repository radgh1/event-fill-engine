Fix the campaign math so the top outcome banner, seats remaining, progress, and status all use the same base calculation.

Use:
expectedAttendance = sum(attendees.map(a => 1 + guestCount))
seatsRemaining = max(0, goal - expectedAttendance)
progressPercent = Math.round((expectedAttendance / goal) * 100)

The top banner should say:
“Current expected attendance is [expectedAttendance] of [goal] seats. [seatsRemaining] seats remain. Based on the selected lead-to-registration assumptions, add approximately [lowLeadNeed]-[highLeadNeed] more qualified leads to close the gap.”

Where:
lowLeadNeed = Math.ceil(seatsRemaining / highConversionRate)
highLeadNeed = Math.ceil(seatsRemaining / lowConversionRate)

Do not show a projected attendee range lower than current expected attendance.
Ensure Current Campaign Status uses the same seatsRemaining and expectedAttendance values.