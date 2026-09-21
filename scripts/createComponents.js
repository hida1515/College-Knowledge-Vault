/**
 * Update placeholder component files for College Knowledge Vault to fix ESLint empty interface error.
 */
const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

const components = [
  // Auth components
  { dir: 'src/features/auth/components', name: 'GoogleSignInButton' },
  { dir: 'src/features/auth/components', name: 'RoleCard' },
  // Onboarding components
  { dir: 'src/features/onboarding/components', name: 'OnboardingPage' },
  { dir: 'src/features/onboarding/components', name: 'PageIndicator' },
  // Home components
  { dir: 'src/features/home/components', name: 'EntryCard' },
  { dir: 'src/features/home/components', name: 'FilterBar' },
  { dir: 'src/features/home/components', name: 'SortToggle' },
  // Entry Detail components
  { dir: 'src/features/entryDetail/components', name: 'VivaAccordion' },
  { dir: 'src/features/entryDetail/components', name: 'RelatedEntries' },
  { dir: 'src/features/entryDetail/components', name: 'ActionMenu' },
  // Dashboard components
  { dir: 'src/features/dashboard/components', name: 'MyEntriesList' },
  { dir: 'src/features/dashboard/components', name: 'StatsGrid' },
  // Search components
  { dir: 'src/features/search/components', name: 'SearchBar' },
  { dir: 'src/features/search/components', name: 'RecentSearches' },
  { dir: 'src/features/search/components', name: 'SearchResults' },
  // Admin components
  { dir: 'src/features/admin/components', name: 'ModerationCard' },
  { dir: 'src/features/admin/components', name: 'StatsChart' },
  // Profile components
  { dir: 'src/features/profile/components', name: 'ProfileHeader' },
  { dir: 'src/features/profile/components', name: 'ContributionStats' },
  // Shared components
  { dir: 'src/shared/components', name: 'CustomButton' },
  { dir: 'src/shared/components', name: 'CustomTextInput' },
  { dir: 'src/shared/components', name: 'TagPill' },
  { dir: 'src/shared/components', name: 'SkeletonLoader' },
  { dir: 'src/shared/components', name: 'EmptyState' },
  { dir: 'src/shared/components', name: 'Toast' },
  { dir: 'src/shared/components', name: 'RoleBadge' },
  { dir: 'src/shared/components', name: 'StatusBadge' },
  { dir: 'src/shared/components', name: 'Avatar' },
];

function getColorsImportPath(dir) {
  if (dir.startsWith('src/shared/')) {
    return '../constants/colors';
  }
  return '../../../shared/constants/colors';
}

function generateComponent(name, dir) {
  const colorsPath = getColorsImportPath(dir);
  return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '${colorsPath}';

interface ${name}Props {
  testID?: string;
}

const ${name}: React.FC<${name}Props> = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>${name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default ${name};
`;
}

let updated = 0;
for (const comp of components) {
  const fullDir = path.join(baseDir, comp.dir);
  const filePath = path.join(fullDir, `${comp.name}.tsx`);
  fs.writeFileSync(filePath, generateComponent(comp.name, comp.dir));
  updated++;
}

console.log(`\nUpdated ${updated} component files.`);
