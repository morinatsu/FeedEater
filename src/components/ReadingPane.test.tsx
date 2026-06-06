import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReadingPane } from './ReadingPane';
import * as AppContextModule from '../context/AppContext';

vi.mock('../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

const mockMarkItemAsRead = vi.fn();

const defaultContext = {
  items: [
    {
      id: 1,
      feed_id: 101,
      title: 'Test Article',
      link: 'https://example.com/article',
      pub_date: '2023-05-01T12:00:00Z',
      content: '<p>Test content <a href="https://example.com/external">External Link</a> <a href="/relative">Relative Link</a> <span>Not a link</span> <a>Empty Link</a></p>',
      is_read: true,
    },
    {
      id: 2,
      feed_id: 101,
      title: 'Unread Article',
      link: 'https://example.com/unread',
      pub_date: '2023-05-02T12:00:00Z',
      content: '<p>Unread content</p>',
      is_read: false,
    }
  ],
  feeds: [
    {
      id: 101,
      title: 'Test Feed',
    }
  ],
  selectedItemId: 1,
  markItemAsRead: mockMarkItemAsRead,
};

describe('ReadingPane', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue(defaultContext);
  });

  it('renders empty state when no item is selected', () => {
    (AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultContext,
      selectedItemId: null,
    });

    render(<ReadingPane />);
    expect(screen.getByText('Select an item to read')).toBeInTheDocument();
    expect(screen.getByAltText('No selection')).toBeInTheDocument();
  });

  it('renders selected item with metadata and content', () => {
    render(<ReadingPane />);

    expect(screen.getByRole('heading', { name: 'Test Article' })).toBeInTheDocument();
    expect(screen.getByText('Test Feed')).toBeInTheDocument();
    expect(screen.getByText('View Original')).toBeInTheDocument();

    // Content should be rendered
    expect(screen.getByText(/Test content/)).toBeInTheDocument();
    expect(screen.getByText('External Link')).toBeInTheDocument();
  });

  it('marks unread item as read when selected', () => {
    (AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultContext,
      selectedItemId: 2, // The unread article
    });

    render(<ReadingPane />);

    expect(mockMarkItemAsRead).toHaveBeenCalledWith(2);
  });

  it('does not mark already read item as read', () => {
    (AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultContext,
      selectedItemId: 1, // The already read article
    });

    render(<ReadingPane />);

    expect(mockMarkItemAsRead).not.toHaveBeenCalled();
  });

  it('opens external link when "View Original" is clicked', () => {
    render(<ReadingPane />);

    const viewOriginalLink = screen.getByText('View Original');
    fireEvent.click(viewOriginalLink);

    expect(window.api.openExternal).toHaveBeenCalledWith('https://example.com/article');
  });

  it('opens external link when absolute URL in content is clicked', () => {
    render(<ReadingPane />);

    const externalLink = screen.getByText('External Link');
    fireEvent.click(externalLink);

    expect(window.api.openExternal).toHaveBeenCalledWith('https://example.com/external');
  });

  it('resolves relative URL in content against original item link and opens it', () => {
    render(<ReadingPane />);

    const relativeLink = screen.getByText('Relative Link');
    fireEvent.click(relativeLink);

    // It should resolve against "https://example.com/article" which results in "https://example.com/relative"
    expect(window.api.openExternal).toHaveBeenCalledWith('https://example.com/relative');
  });

  it('ignores click on non-anchor elements in content', () => {
    render(<ReadingPane />);

    const spanElement = screen.getByText('Not a link');
    fireEvent.click(spanElement);

    expect(window.api.openExternal).not.toHaveBeenCalled();
  });

  it('handles anchor tags without href gracefully', () => {
    render(<ReadingPane />);

    const emptyLink = screen.getByText('Empty Link');
    fireEvent.click(emptyLink);

    expect(window.api.openExternal).not.toHaveBeenCalled();
  });

  it('handles URL parsing errors gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    (AppContextModule.useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      ...defaultContext,
      items: [{
        ...defaultContext.items[0],
        id: 3,
        link: 'not-a-valid-base-url', // Invalid base URL
        content: '<a href="/invalid">Invalid Base Link</a>'
      }],
      selectedItemId: 3,
    });

    render(<ReadingPane />);
    const invalidLink = screen.getByText('Invalid Base Link');
    fireEvent.click(invalidLink);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to parse URL:",
        "/invalid",
        expect.any(Error)
    );
    expect(window.api.openExternal).not.toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
