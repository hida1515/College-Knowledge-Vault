/**
 * Create placeholder screen files for College Knowledge Vault
 * This is a build-time utility script — not part of the app.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

const screens = [
  // Auth
  { dir: 'src/features/auth/screens', name: 'LoginScreen' },
  { dir: 'src/features/auth/screens', name: 'RoleSelectionScreen' },
  // Onboarding
  { dir: 'src/features/onboarding/screens', name: 'OnboardingScreen' },
  // Home
  { dir: 'src/features/home/screens', name: 'HomeScreen' },
  // Entry Detail
  { dir: 'src/features/entryDetail/screens', name: 'EntryDetailScreen' },
  // Submit Entry
  { dir: 'src/features/submitEntry/screens', name: 'SubmitStep1Type' },
  { dir: 'src/features/submitEntry/screens', name: 'SubmitStep2Details' },
  { dir: 'src/features/submitEntry/screens', name: 'SubmitStep3Tags' },
  { dir: 'src/features/submitEntry/screens', name: 'SubmitStep4Viva' },
  { dir: 'src/features/submitEntry/screens', name: 'SubmitStep5Review' },
  // Dashboard
  { dir: 'src/features/dashboard/screens', name: 'DashboardScreen' },
  // Search
  { dir: 'src/features/search/screens', name: 'SearchScreen' },
  // Admin
  { dir: 'src/features/admin/screens', name: 'AdminHomeScreen' },
  { dir: 'src/features/admin/screens', name: 'ModerationDetailScreen' },
  { dir: 'src/features/admin/screens', name: 'UserManagementScreen' },
  // Profile
  { dir: 'src/features/profile/screens', name: 'ProfileScreen' },
];

function generateScreen(screenName) {
  // Compute the relative path to colors.ts from this screen's location
  // All screens are at: src/features/<feature>/screens/
  // Colors is at: src/shared/constants/colors.ts
  const relPath = '../../../shared/constants/colors';

  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '${relPath}';

const ${screenName}: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>${screenName.replace(/([A-Z])/g, ' $1').trim()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
});

export default ${screenName};
`;
}

let created = 0;
for (const screen of screens) {
  const fullDir = path.join(baseDir, screen.dir);
  fs.mkdirSync(fullDir, { recursive: true });
  const filePath = path.join(fullDir, `${screen.name}.tsx`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, generateScreen(screen.name));
    created++;
    console.log(`✓ Created ${screen.dir}/${screen.name}.tsx`);
  } else {
    console.log(`• Skipped ${screen.dir}/${screen.name}.tsx (exists)`);
  }
}

console.log(`\nDone! Created ${created} screen files.`);
