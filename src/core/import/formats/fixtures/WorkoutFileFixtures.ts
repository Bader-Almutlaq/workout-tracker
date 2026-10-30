/** Small invented exports only; none of these dialects has been checked against an owner's file. */
export const WorkoutFileFixtures = Object.freeze({
  hevy: [
    'title,start_time,end_time,description,exercise_title,superset_id,exercise_notes,set_index,set_type,weight_lbs,reps,distance_miles,duration_seconds,rpe,ignored',
    '"Push, heavy","26 Oct 2024, 18:00","26 Oct 2024, 19:00",Good session,Bench,,"Wide grip, pause",0,warmup,45,8,,,6,x',
    '"Push, heavy","26 Oct 2024, 18:00","26 Oct 2024, 19:00",Good session,Bench,,"Wide grip, pause",1,normal,135,5,,,8,x',
    '"Push, heavy","26 Oct 2024, 18:00","26 Oct 2024, 19:00",Good session,Bench,,,2,dropset,90,8,,,9,x',
    '"Push, heavy","26 Oct 2024, 18:00","26 Oct 2024, 19:00",Good session,Bench,,,3,failure,90,4,1,65,10,x',
  ].join('\n'),
  fitnotes: [
    'Date,Exercise,Category,Weight (lbs),Reps,Distance,Distance Unit,Time,Comment,Ignored',
    '2024-03-10,Curl,Arms,20,8,,,,"Pause, then lift",x',
    '2024-03-11,Run,Cardio,0,0,1,miles,01:02:03,"Steady ""pace""",x',
    '2024-03-10,Curl,Arms,25,6,,,,Last set,x',
  ].join('\n'),
  fitbod: [
    'Date,Exercise,Reps,Weight(lb),Duration(s),Distance(m),Incline,Resistance,isWarmup,Note,multiplier,Ignored',
    '2024-11-03 01:30:15,Curl,8,20,,,,,true,"Pause, lift",2,x',
    '2024-11-03 01:30:55,Curl,6,30,,,,,false,"Keep ""steady""",2,x',
    '2024-11-03 01:31:00,Run,0,0,65,400,,,false,,1,x',
    '2024-11-04,Curl,8,25,,,,,false,,2,x',
  ].join('\n'),
});
