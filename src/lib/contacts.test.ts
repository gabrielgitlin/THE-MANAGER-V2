import { describe, it, expect } from 'vitest';
import { getInitials, formatContactName, getAvatarUrl } from './contacts';

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Doe')).toBe('JD');
  });
  it('handles lowercase input', () => {
    expect(getInitials('jane', 'smith')).toBe('JS');
  });
});

describe('formatContactName', () => {
  it('joins first and last name with a space', () => {
    expect(formatContactName({ firstName: 'Taylor', lastName: 'Swift' })).toBe('Taylor Swift');
  });
});

describe('getAvatarUrl', () => {
  it('returns profilePhotoUrl when present', () => {
    expect(getAvatarUrl({ profilePhotoUrl: 'https://example.com/pic.jpg', socialLinks: {} }))
      .toBe('https://example.com/pic.jpg');
  });
  it('falls back to instagram unavatar when no photo', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: { instagram: 'johndoe' } }))
      .toBe('https://unavatar.io/instagram/johndoe');
  });
  it('falls back to twitter unavatar when no photo and no instagram', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: { twitter: 'johndoe' } }))
      .toBe('https://unavatar.io/twitter/johndoe');
  });
  it('returns null when no photo or social handles available', () => {
    expect(getAvatarUrl({ profilePhotoUrl: undefined, socialLinks: {} })).toBeNull();
  });
  it('prefers instagram over twitter when both are present', () => {
    const result = getAvatarUrl({
      profilePhotoUrl: undefined,
      socialLinks: { instagram: 'iguser', twitter: 'twuser' },
    });
    expect(result).toBe('https://unavatar.io/instagram/iguser');
  });
});
