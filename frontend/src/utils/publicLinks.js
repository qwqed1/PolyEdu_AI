export function getPublicResourcePath(type, id) {
  switch (type) {
    case 'lesson-plan':
      return `/library/lesson-plans/${id}`;
    case 'quiz':
      return `/library/quizzes/${id}`;
    case 'game':
      return `/library/games/${id}`;
    default:
      return '/library';
  }
}

export function getPublicResourceUrl(type, id) {
  const path = getPublicResourcePath(type, id);
  if (typeof window === 'undefined') {
    return path;
  }
  return new URL(path, window.location.origin).toString();
}
