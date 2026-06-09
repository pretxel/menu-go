/**
 * @jest-environment jsdom
 */
import {
  clearFunnelState,
  FUNNEL_STORAGE_KEY,
  type FunnelState,
  loadFunnelState,
  MAX_IMAGE_CHARS,
  saveFunnelState,
} from '../src/lib/funnel-storage';

const sampleState: FunnelState = {
  step: 'preview',
  imageBase64: 'data:image/png;base64,AAAA',
  categories: [
    {
      name: 'Starters',
      dishes: [{ name: 'Nachos', description: 'Crispy', price: 8.5, tags: ['vegetarian'] }],
    },
  ],
  restaurant: { name: 'Casa Edsel', address: '', phone: '' },
};

beforeEach(() => {
  window.sessionStorage.clear();
  jest.restoreAllMocks();
});

describe('saveFunnelState / loadFunnelState', () => {
  it('round-trips the full state', () => {
    expect(saveFunnelState(sampleState)).toBe('full');
    expect(loadFunnelState()).toEqual(sampleState);
  });

  it('drops an oversized image but keeps the rest of the state', () => {
    const oversized: FunnelState = {
      ...sampleState,
      imageBase64: 'x'.repeat(MAX_IMAGE_CHARS + 1),
    };

    expect(saveFunnelState(oversized)).toBe('without-image');

    const restored = loadFunnelState();
    expect(restored?.imageBase64).toBeUndefined();
    expect(restored?.categories).toEqual(sampleState.categories);
    expect(restored?.step).toBe('preview');
  });

  it('retries without the image when sessionStorage quota is exceeded', () => {
    const setItem = jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new DOMException('quota', 'QuotaExceededError');
      });

    expect(saveFunnelState(sampleState)).toBe('without-image');
    expect(setItem).toHaveBeenCalledTimes(2);

    const restored = loadFunnelState();
    expect(restored?.imageBase64).toBeUndefined();
    expect(restored?.categories).toEqual(sampleState.categories);
  });

  it('returns "failed" when storage rejects even without the image', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });

    expect(saveFunnelState(sampleState)).toBe('failed');
  });

  it('returns null when nothing is stored', () => {
    expect(loadFunnelState()).toBeNull();
  });

  it('returns null for corrupt or malformed stored values', () => {
    window.sessionStorage.setItem(FUNNEL_STORAGE_KEY, 'not-json{');
    expect(loadFunnelState()).toBeNull();

    window.sessionStorage.setItem(FUNNEL_STORAGE_KEY, JSON.stringify({ step: 42 }));
    expect(loadFunnelState()).toBeNull();
  });
});

describe('clearFunnelState', () => {
  it('removes the stored state', () => {
    saveFunnelState(sampleState);
    clearFunnelState();
    expect(window.sessionStorage.getItem(FUNNEL_STORAGE_KEY)).toBeNull();
    expect(loadFunnelState()).toBeNull();
  });
});
