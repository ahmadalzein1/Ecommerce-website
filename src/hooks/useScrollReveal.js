import { useEffect } from 'react';

/**
 * Hook to handle scroll reveal animations using Intersection Observer.
 * It searches for elements with the 'reveal' class and adds 'reveal-active' when they enter the viewport.
 * @param {Array} deps - Dependency array to re-trigger the observer when content changes.
 */
export default function useScrollReveal(deps = []) {
  useEffect(() => {
    // Small delay to ensure DOM is updated after React render
    const timeoutId = setTimeout(() => {
      const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1,
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      }, observerOptions);

      const revealElements = document.querySelectorAll('.reveal');
      revealElements.forEach((el) => observer.observe(el));

      return () => {
        revealElements.forEach((el) => observer.unobserve(el));
      };
    }, 100);

    return () => clearTimeout(timeoutId);
  }, deps);
}
