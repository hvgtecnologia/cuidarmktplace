import { redirect } from 'next/navigation'

export default function CaregiverOnboardingRedirect() {
  redirect('/caregiver/profile')
}
