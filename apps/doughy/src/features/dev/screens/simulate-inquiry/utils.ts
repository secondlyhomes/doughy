// src/features/dev/screens/simulate-inquiry/utils.ts
// Utility functions for simulate inquiry

export function generatePlaceholderResponse(
  name: string,
  profession: string,
  checkIn: Date,
  checkOut: Date
): string {
  const firstName = name.split(' ')[0] || 'there';
  const checkInStr = checkIn.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const checkOutStr = checkOut.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const templates = [
    `Hi ${firstName}! Thank you for your interest in our property. Great news - we do have availability from ${checkInStr} to ${checkOutStr}!\n\nWe love hosting ${profession.toLowerCase()}s and have had wonderful experiences with guests in similar situations.\n\nThe property features high-speed WiFi, a dedicated workspace, and all the amenities you'll need for a comfortable stay.\n\nWould you like to schedule a virtual tour or do you have any specific questions about the property?\n\nBest regards`,

    `Hello ${firstName}! Thanks for reaching out about our listing.\n\nYes, we have availability for your requested dates (${checkInStr} - ${checkOutStr}). As a ${profession.toLowerCase()}, you'll appreciate our quiet neighborhood and reliable WiFi.\n\nA few highlights:\n- Fully furnished with everything you need\n- Dedicated parking\n- Close to local amenities\n\nLet me know if you'd like more details or photos!\n\nBest,`,

    `Hi ${firstName}, thanks for the inquiry!\n\nGood news - the property is available from ${checkInStr} through ${checkOutStr}. We've hosted many ${profession.toLowerCase()}s and the space works perfectly for longer stays.\n\nThe monthly rate includes all utilities, WiFi, and weekly cleaning. We're flexible on move-in times and can accommodate your schedule.\n\nFeel free to ask any questions - happy to help!\n\nWarm regards`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}
