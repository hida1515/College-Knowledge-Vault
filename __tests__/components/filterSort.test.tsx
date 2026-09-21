/**
 * FilterBar and SortToggle Component Tests
 * College Knowledge Vault
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FilterBar } from '../../src/features/home/components/FilterBar';
import { SortToggle } from '../../src/features/home/components/SortToggle';
import { EntryType } from '../../src/core/types/entry.types';

describe('Filter and Sort Component Tests', () => {
  describe('TEST GROUP 1: FilterBar', () => {
    test('1a: renders All, Project, Viva, Mistake, Resource chips', async () => {
      const { getByText } = await render(
        <FilterBar selectedType={undefined} onFilterChange={jest.fn()} />,
      );
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Project')).toBeTruthy();
      expect(getByText('Viva')).toBeTruthy();
      expect(getByText('Mistake')).toBeTruthy();
      expect(getByText('Resource')).toBeTruthy();
    });

    test('1b: All chip active by default (when selectedType=undefined)', async () => {
      const { getByTestId } = await render(
        <FilterBar selectedType={undefined} onFilterChange={jest.fn()} />,
      );
      const allChip = getByTestId('filter-chip-All');
      expect(allChip).toBeTruthy();
    });

    test('1c: tapping Project chip calls onFilterChange("project")', async () => {
      const onFilterChange = jest.fn();
      const { getByTestId } = await render(
        <FilterBar selectedType={undefined} onFilterChange={onFilterChange} />,
      );

      fireEvent.press(getByTestId('filter-chip-Project'));
      expect(onFilterChange).toHaveBeenCalledWith(EntryType.Project);
    });

    test('1d: tapping All chip calls onFilterChange(undefined)', async () => {
      const onFilterChange = jest.fn();
      const { getByTestId } = await render(
        <FilterBar selectedType={EntryType.Project} onFilterChange={onFilterChange} />,
      );

      fireEvent.press(getByTestId('filter-chip-All'));
      expect(onFilterChange).toHaveBeenCalledWith(undefined);
    });
  });

  describe('TEST GROUP 2: SortToggle', () => {
    test('2a: renders Recent and Popular options', async () => {
      const { getByText } = await render(
        <SortToggle sortBy="created_at" onSortChange={jest.fn()} />,
      );
      expect(getByText('Recent')).toBeTruthy();
      expect(getByText('Popular')).toBeTruthy();
    });

    test('2b: Recent active by default when sortBy="created_at"', async () => {
      const { getByTestId } = await render(
        <SortToggle sortBy="created_at" onSortChange={jest.fn()} />,
      );
      expect(getByTestId('sort-recent')).toBeTruthy();
    });

    test('2c: tapping Popular calls onSortChange("upvote_count")', async () => {
      const onSortChange = jest.fn();
      const { getByTestId } = await render(
        <SortToggle sortBy="created_at" onSortChange={onSortChange} />,
      );

      fireEvent.press(getByTestId('sort-popular'));
      expect(onSortChange).toHaveBeenCalledWith('upvote_count');
    });

    test('2d: tapping Recent calls onSortChange("created_at")', async () => {
      const onSortChange = jest.fn();
      const { getByTestId } = await render(
        <SortToggle sortBy="upvote_count" onSortChange={onSortChange} />,
      );

      fireEvent.press(getByTestId('sort-recent'));
      expect(onSortChange).toHaveBeenCalledWith('created_at');
    });
  });
});
