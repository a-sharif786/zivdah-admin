import { Grid } from '@mui/material';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { StatTile } from '@/components/common/StatTile';
import { useAuth } from '@/hooks/useAuth';
import { productApi } from '@/api/productApi';
import { orderApi } from '@/api/orderApi';

export function VendorDashboardPage() {
  const { user } = useAuth();
  const vendorId = user!.id;

  const products = useQuery({
    queryKey: ['vendor-dashboard', 'products', vendorId],
    queryFn: () => productApi.getByVendor(vendorId, 0, 1),
  });
  const orders = useQuery({
    queryKey: ['vendor-dashboard', 'orders', vendorId],
    queryFn: () => orderApi.getByVendor(vendorId, 0, 1),
  });

  return (
    <div>
      <PageHeader title={`Welcome, ${user?.name}`} subtitle="Here's a snapshot of your store" />
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatTile
            title="My Products (page sample)"
            icon={<Inventory2OutlinedIcon />}
            color="#f59e0b"
            value={products.data?.length ?? 0}
            loading={products.isLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatTile
            title="My Orders (page sample)"
            icon={<ShoppingCartOutlinedIcon />}
            color="#06b6d4"
            value={orders.data?.length ?? 0}
            loading={orders.isLoading}
          />
        </Grid>
      </Grid>
    </div>
  );
}
