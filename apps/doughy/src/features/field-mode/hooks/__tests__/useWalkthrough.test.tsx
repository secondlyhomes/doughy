// Tests for useWalkthrough hook
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useWalkthrough, useDemoWalkthrough } from '../useWalkthrough';
import { mockWalkthrough, mockAISummary } from '../../data/mockWalkthrough';

describe('useWalkthrough', () => {
  const defaultOptions = { dealId: 'test-deal-123' };

  it('should initialize with empty walkthrough for new deal', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    expect(result.current.walkthrough.deal_id).toBe('test-deal-123');
    expect(result.current.walkthrough.status).toBe('in_progress');
    expect(result.current.items).toHaveLength(0);
    expect(result.current.aiSummary).toBeUndefined();
  });

  it('should initialize with provided initial data', () => {
    const { result } = renderHook(() =>
      useWalkthrough({ dealId: 'test-deal', initialData: mockWalkthrough })
    );

    expect(result.current.walkthrough.id).toBe(mockWalkthrough.id);
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.aiSummary).toEqual(mockAISummary);
  });

  it('should add a photo to walkthrough', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo.jpg', 'Test note');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].bucket).toBe('exterior_roof');
    expect(result.current.items[0].item_type).toBe('photo');
    expect(result.current.items[0].file_url).toBe('file:///test/photo.jpg');
    expect(result.current.items[0].notes).toBe('Test note');
  });

  it('should add a voice memo to walkthrough', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addVoiceMemo('kitchen', 'file:///test/memo.m4a', 'Transcript text');
    });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].bucket).toBe('kitchen');
    expect(result.current.items[0].item_type).toBe('voice_memo');
    expect(result.current.items[0].transcript).toBe('Transcript text');
  });

  it('should remove an item from walkthrough', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    // Add an item
    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo1.jpg');
    });

    expect(result.current.items).toHaveLength(1);
    const itemId = result.current.items[0].id;

    // Remove the item
    act(() => {
      result.current.removeItem(itemId);
    });

    expect(result.current.items).toHaveLength(0);
  });

  it('should handle multiple items being added', () => {
    const { result } = renderHook(() =>
      useWalkthrough({ dealId: 'test', initialData: mockWalkthrough })
    );

    // Mock walkthrough already has multiple items
    const initialCount = result.current.items.length;
    expect(initialCount).toBeGreaterThan(1);

    // Remove an item by its ID
    const itemToRemove = result.current.items[0];
    act(() => {
      result.current.removeItem(itemToRemove.id);
    });

    expect(result.current.items).toHaveLength(initialCount - 1);
    expect(result.current.items.find((i) => i.id === itemToRemove.id)).toBeUndefined();
  });

  it('should update item notes', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('baths', 'file:///test/photo.jpg', 'Original note');
    });

    const itemId = result.current.items[0].id;

    act(() => {
      result.current.updateItemNotes(itemId, 'Updated note');
    });

    expect(result.current.items[0].notes).toBe('Updated note');
  });

  it('should get items for specific bucket', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo1.jpg');
      result.current.addPhoto('kitchen', 'file:///test/photo2.jpg');
      result.current.addPhoto('exterior_roof', 'file:///test/photo3.jpg');
    });

    const exteriorItems = result.current.getItemsForBucket('exterior_roof');
    expect(exteriorItems).toHaveLength(2);

    const kitchenItems = result.current.getItemsForBucket('kitchen');
    expect(kitchenItems).toHaveLength(1);
  });

  it('should count photos correctly', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo1.jpg');
      result.current.addPhoto('exterior_roof', 'file:///test/photo2.jpg');
      result.current.addVoiceMemo('exterior_roof', 'file:///test/memo.m4a');
    });

    expect(result.current.getPhotoCount('exterior_roof')).toBe(2);
    expect(result.current.getMemoCount('exterior_roof')).toBe(1);
  });

  it('should calculate progress correctly', () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    expect(result.current.progress.totalPhotos).toBe(0);
    expect(result.current.progress.totalMemos).toBe(0);
    expect(result.current.progress.isComplete).toBe(false);

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo1.jpg');
      result.current.addPhoto('kitchen', 'file:///test/photo2.jpg');
      result.current.addVoiceMemo('baths', 'file:///test/memo.m4a');
    });

    expect(result.current.progress.totalPhotos).toBe(2);
    expect(result.current.progress.totalMemos).toBe(1);
    expect(result.current.progress.bucketsWithContent).toHaveLength(3);
    expect(result.current.progress.isComplete).toBe(true); // 3+ buckets = complete
  });

  it('should organize with AI and update status', async () => {
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo.jpg');
    });

    expect(result.current.walkthrough.status).toBe('in_progress');
    expect(result.current.isOrganizing).toBe(false);

    await act(async () => {
      await result.current.organizeWithAI();
    });

    expect(result.current.walkthrough.status).toBe('organized');
    expect(result.current.aiSummary).toBeDefined();
    expect(result.current.aiSummary?.issues).toBeDefined();
    expect(result.current.aiSummary?.questions).toBeDefined();
    expect(result.current.aiSummary?.scope_bullets).toBeDefined();
  });

  it('should save walkthrough', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { result } = renderHook(() => useWalkthrough(defaultOptions));

    act(() => {
      result.current.addPhoto('exterior_roof', 'file:///test/photo.jpg');
    });

    await act(async () => {
      await result.current.saveWalkthrough();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Saving walkthrough:',
      expect.objectContaining({ deal_id: 'test-deal-123' })
    );

    consoleSpy.mockRestore();
  });
});

describe('useDemoWalkthrough', () => {
  it('should return pre-populated walkthrough data', () => {
    const { result } = renderHook(() => useDemoWalkthrough());

    expect(result.current.walkthrough.id).toBe(mockWalkthrough.id);
    expect(result.current.items.length).toBeGreaterThan(0);
    expect(result.current.aiSummary).toBeDefined();
  });
});
