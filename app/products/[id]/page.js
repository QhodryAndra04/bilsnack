import ProductDetailPage from '../../ProductDetailPage';

export default async function ProductDetail({ params }) {
  const { id } = await params;
  return <ProductDetailPage productId={id} />;
}