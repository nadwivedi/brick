import { useLocation, useNavigate } from 'react-router-dom';

export const PRICE_PAGE = '/products/brick-kiln-software-price-in-india';
export const BHATTA_PAGE = '/products/bhatta-software';
export const MANUFACTURING_PAGE = '/products/bricks-manufacturing-software';

export const scrollToSection = (id) => {
  const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
};

// Links to homepage sections: scroll when already on the homepage, otherwise open it at that section
// (HomePage scrolls to the #hash once it renders).
export function useGoToSection() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (id) => (e) => {
    e.preventDefault();
    if (pathname === '/') scrollToSection(id);
    else navigate(`/#${id}`);
  };
}
