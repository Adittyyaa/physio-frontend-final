import { uid } from './utils'

export const DEFAULT_EXERCISES = [
  { id: uid(), name: 'Chin Tucks', category: 'neck', reps: '3 × 10', instructions: 'Sit tall, pull chin straight back. Hold 5 secs.', media: '' },
  { id: uid(), name: 'Neck Rotation', category: 'neck', reps: '10 each side', instructions: 'Slowly rotate head side to side. Hold at end range 3 secs.', media: '' },
  { id: uid(), name: 'Shoulder Pendulum', category: 'shoulder', reps: '2 × 30 sec', instructions: 'Lean forward, let arm hang free. Make small circles.', media: '' },
  { id: uid(), name: 'Shoulder External Rotation', category: 'shoulder', reps: '3 × 12', instructions: 'Elbow at 90°, rotate outward with resistance band.', media: '' },
  { id: uid(), name: 'Cat-Cow Stretch', category: 'back', reps: '3 × 10', instructions: 'On all fours, alternate arching and rounding spine.', media: '' },
  { id: uid(), name: 'Bird Dog', category: 'back', reps: '3 × 10 each', instructions: 'On all fours, extend opposite arm and leg. Hold 3 secs.', media: '' },
  { id: uid(), name: 'Knee Straight Leg Raise', category: 'knee', reps: '3 × 15', instructions: 'Lying down, keep knee straight, raise leg to 45°.', media: '' },
  { id: uid(), name: 'Quad Sets', category: 'knee', reps: '3 × 15', instructions: 'Tighten thigh muscle, hold 5 secs, relax.', media: '' },
  { id: uid(), name: 'Clamshells', category: 'hip', reps: '3 × 15', instructions: 'Side lying, knees bent, rotate top knee up like a clamshell.', media: '' },
  { id: uid(), name: 'Ankle Pumps', category: 'ankle', reps: '3 × 20', instructions: 'Flex and point foot repeatedly to improve circulation.', media: '' },
]


