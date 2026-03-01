import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ItemList } from './ItemList';
import * as AppContextModule from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
    useAppContext: vi.fn(),
}));

describe('ItemList', () => {
    it('renders loading state', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: true,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);
        expect(screen.getByText('Loading items...')).toBeInTheDocument();
    });

    it('renders empty state', () => {
        vi.spyOn(AppContextModule, 'useAppContext').mockReturnValue({
            items: [],
            selectedItemId: null,
            setSelectedItemId: vi.fn(),
            sortOrder: 'desc',
            setSortOrder: vi.fn(),
            isLoading: false,
        } as unknown as ReturnType<typeof AppContextModule.useAppContext>);

        render(<ItemList />);
        expect(screen.getByText('No items found.')).toBeInTheDocument();
    });
});
