'use client';

import { deleteProduct } from '@/app/actions/product';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';
import { useTransition } from 'react';
import { toast } from 'react-toastify';

const ProductActions = ({ productId }) => {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      startTransition(async () => {
        const result = await deleteProduct(productId);
        if (result.error) {
          toast.error(result.error);
        } else {
          toast.success('Product deleted successfully');
        }
      });
    }
  };

  return (
    <td className="text-center">
      <div className="d-flex justify-content-center align-items-center gap-2">
        <Link href={`/products/${productId}/edit`} className="text-reset fs-16 d-flex align-items-center" title="Edit">
          <IconifyIcon icon="tabler:pencil" width={18} height={18} />
        </Link>
        <button 
          onClick={handleDelete} 
          disabled={isPending}
          className="btn btn-link text-danger fs-16 p-0 border-0 d-flex align-items-center" 
          title="Delete"
        >
          <IconifyIcon icon="tabler:trash" width={18} height={18} />
        </button>
      </div>
    </td>
  );
};

export default ProductActions;
