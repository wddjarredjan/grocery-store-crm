import { Product, User, Sale, CashDrawerShift } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_admin_1',
    name: 'Alicia Morgan',
    email: 'alicia.owner@freshmart.com',
    phone: '+1 (555) 010-0001',
    password: 'admin123',
    role: 'admin_owner',
    pin: '0000',
    isActive: true,
  },
  {
    id: 'usr_mgr_1',
    name: 'Sofia Ramirez',
    email: 'sofia.manager@freshmart.com',
    phone: '+1 (555) 010-1234',
    password: 'manager123',
    role: 'manager',
    pin: '1234',
    isActive: true,
  },
  {
    id: 'usr_purch_1',
    name: 'Nina Patel',
    email: 'nina.purchasing@freshmart.com',
    phone: '+1 (555) 010-4321',
    password: 'purchase123',
    role: 'purchasing',
    pin: '4321',
    isActive: true,
  },
  {
    id: 'usr_inv_1',
    name: 'Alex Rivera',
    email: 'alex.rivera@freshmart.com',
    phone: '+1 (555) 010-2222',
    password: 'inventory123',
    role: 'inventory',
    pin: '2222',
    isActive: true,
  },
  {
    id: 'usr_csh_1',
    name: 'Marco Chen',
    email: 'marco.chen@freshmart.com',
    phone: '+1 (555) 010-1111',
    password: 'cashier123',
    role: 'cashier',
    pin: '1111',
    isActive: true,
  },
  {
    id: 'usr_csh_2',
    name: 'Elena Rostova',
    email: 'elena.r@freshmart.com',
    phone: '+1 (555) 010-3333',
    password: 'cashier321',
    role: 'cashier',
    pin: '3333',
    isActive: true,
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // Produce & Fruits
  {
    id: 'prd_bananas_4011',
    barcode: '000000004011',
    plu: '4011',
    name: 'Cavendish Bananas',
    category: 'Produce & Fruits',
    unit: 'kg',
    costPrice: 0.85,
    sellingPrice: 1.49,
    stockQuantity: 185.5,
    minStockThreshold: 35.0,
    isWeighted: true,
    supplier: 'Tropical Green Imports',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_avocado_4046',
    barcode: '000000004046',
    plu: '4046',
    name: 'Hass Avocados (Ripe)',
    category: 'Produce & Fruits',
    unit: 'pcs',
    costPrice: 0.95,
    sellingPrice: 1.79,
    stockQuantity: 62,
    minStockThreshold: 20,
    isWeighted: false,
    supplier: 'Valley Fresh Farms',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_apples_4173',
    barcode: '000000004173',
    plu: '4173',
    name: 'Honeycrisp Apples',
    category: 'Produce & Fruits',
    unit: 'kg',
    costPrice: 1.8,
    sellingPrice: 3.29,
    stockQuantity: 84.2,
    minStockThreshold: 25.0,
    isWeighted: true,
    supplier: 'Orchard Hill Organics',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_tomatoes_4087',
    barcode: '000000004087',
    plu: '4087',
    name: 'Roma Tomatoes Vine',
    category: 'Produce & Fruits',
    unit: 'kg',
    costPrice: 1.25,
    sellingPrice: 2.49,
    stockQuantity: 42.0,
    minStockThreshold: 15.0,
    isWeighted: true,
    supplier: 'Valley Fresh Farms',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_onions_bag',
    barcode: '071110001091',
    name: 'Yellow Onions 3lb Bag',
    category: 'Produce & Fruits',
    unit: 'bag',
    costPrice: 1.4,
    sellingPrice: 2.99,
    stockQuantity: 8, // Low stock on purpose for testing alerts!
    minStockThreshold: 15,
    isWeighted: false,
    supplier: 'Valley Fresh Farms',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_broccoli_crowns',
    barcode: '000000003082',
    plu: '3082',
    name: 'Fresh Broccoli Crowns',
    category: 'Produce & Fruits',
    unit: 'kg',
    costPrice: 1.6,
    sellingPrice: 2.99,
    stockQuantity: 28.5,
    minStockThreshold: 12.0,
    isWeighted: true,
    supplier: 'Green Valley Produce',
    updatedAt: new Date().toISOString(),
  },

  // Dairy & Eggs
  {
    id: 'prd_milk_whole',
    barcode: '011110416001',
    name: 'Farm Fresh Whole Milk 1 Gallon',
    category: 'Dairy & Eggs',
    unit: 'bottle',
    costPrice: 2.65,
    sellingPrice: 4.29,
    stockQuantity: 46,
    minStockThreshold: 18,
    supplier: 'Meadow Gold Creamery',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_eggs_dozen',
    barcode: '072220101124',
    name: 'Cage-Free Grade A Large Eggs (12pk)',
    category: 'Dairy & Eggs',
    unit: 'pack',
    costPrice: 2.85,
    sellingPrice: 4.79,
    stockQuantity: 9, // Low stock on purpose
    minStockThreshold: 20,
    supplier: 'Sunny Meadow Pastures',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_greek_yogurt',
    barcode: '041789001234',
    name: 'Greek Plain Yogurt 32oz (907g)',
    category: 'Dairy & Eggs',
    unit: 'pack',
    costPrice: 3.2,
    sellingPrice: 5.49,
    stockQuantity: 34,
    minStockThreshold: 10,
    supplier: 'Chobani Dairy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_cheddar_block',
    barcode: '021130089123',
    name: 'Sharp Cheddar Cheese Block 8oz',
    category: 'Dairy & Eggs',
    unit: 'pack',
    costPrice: 2.15,
    sellingPrice: 3.99,
    stockQuantity: 52,
    minStockThreshold: 15,
    supplier: 'Tillamook Dairy',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_butter_salted',
    barcode: '034500151128',
    name: 'Sweet Cream Salted Butter 1lb',
    category: 'Dairy & Eggs',
    unit: 'pack',
    costPrice: 2.9,
    sellingPrice: 4.89,
    stockQuantity: 38,
    minStockThreshold: 14,
    supplier: 'Land O Lakes',
    updatedAt: new Date().toISOString(),
  },

  // Bakery & Deli
  {
    id: 'prd_sourdough_loaf',
    barcode: '085239112233',
    name: 'Artisan Sourdough Boule',
    category: 'Bakery & Deli',
    unit: 'pcs',
    costPrice: 2.2,
    sellingPrice: 4.99,
    stockQuantity: 24,
    minStockThreshold: 8,
    supplier: 'Daily In-Store Oven',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_french_baguette',
    barcode: '085239112240',
    name: 'Crusty French Baguette 300g',
    category: 'Bakery & Deli',
    unit: 'pcs',
    costPrice: 0.95,
    sellingPrice: 2.49,
    stockQuantity: 35,
    minStockThreshold: 10,
    supplier: 'Daily In-Store Oven',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_butter_croissants',
    barcode: '085239112257',
    name: 'All-Butter Croissants (4-Pack)',
    category: 'Bakery & Deli',
    unit: 'pack',
    costPrice: 2.4,
    sellingPrice: 4.69,
    stockQuantity: 18,
    minStockThreshold: 8,
    supplier: 'Daily In-Store Oven',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_turkey_deli',
    barcode: '043000012398',
    name: 'Oven Roasted Turkey Breast Slices 250g',
    category: 'Bakery & Deli',
    unit: 'pack',
    costPrice: 3.5,
    sellingPrice: 5.99,
    stockQuantity: 22,
    minStockThreshold: 10,
    supplier: 'Boars Head Meats',
    updatedAt: new Date().toISOString(),
  },

  // Meat & Poultry
  {
    id: 'prd_chicken_breast',
    barcode: '201234000000',
    name: 'Boneless Skinless Chicken Breast',
    category: 'Meat & Poultry',
    unit: 'kg',
    costPrice: 5.2,
    sellingPrice: 8.99,
    stockQuantity: 65.4,
    minStockThreshold: 20.0,
    isWeighted: true,
    supplier: 'Perdue Farms',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_ground_beef',
    barcode: '201235000000',
    name: 'Lean Ground Beef 85/15',
    category: 'Meat & Poultry',
    unit: 'kg',
    costPrice: 7.1,
    sellingPrice: 11.49,
    stockQuantity: 41.2,
    minStockThreshold: 15.0,
    isWeighted: true,
    supplier: 'Prime Cut Butchery',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_salmon_fresh',
    barcode: '201236000000',
    name: 'Fresh Atlantic Salmon Fillet',
    category: 'Meat & Poultry',
    unit: 'kg',
    costPrice: 10.5,
    sellingPrice: 16.99,
    stockQuantity: 19.8,
    minStockThreshold: 8.0,
    isWeighted: true,
    supplier: 'Ocean Catch Seafood',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_bacon_pack',
    barcode: '037600123456',
    name: 'Applewood Smoked Thick Bacon 375g',
    category: 'Meat & Poultry',
    unit: 'pack',
    costPrice: 3.8,
    sellingPrice: 6.49,
    stockQuantity: 31,
    minStockThreshold: 12,
    supplier: 'Hormel Foods',
    updatedAt: new Date().toISOString(),
  },

  // Beverages
  {
    id: 'prd_water_pack',
    barcode: '078742351231',
    name: 'Natural Spring Water 24x500ml',
    category: 'Beverages',
    unit: 'pack',
    costPrice: 2.8,
    sellingPrice: 4.99,
    stockQuantity: 74,
    minStockThreshold: 20,
    supplier: 'Crystal Springs',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_orange_juice',
    barcode: '048500001234',
    name: '100% Pure Florida Orange Juice 1.5L',
    category: 'Beverages',
    unit: 'bottle',
    costPrice: 2.4,
    sellingPrice: 3.99,
    stockQuantity: 38,
    minStockThreshold: 14,
    supplier: 'Tropicana Grove',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_cold_brew',
    barcode: '085239011928',
    name: 'Organic Cold Brew Coffee 32oz',
    category: 'Beverages',
    unit: 'bottle',
    costPrice: 2.7,
    sellingPrice: 4.79,
    stockQuantity: 5, // Low stock on purpose
    minStockThreshold: 12,
    supplier: 'Stumptown Coffee',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_oat_milk',
    barcode: '085239012345',
    name: 'Barista Edition Oat Milk 1L',
    category: 'Beverages',
    unit: 'pack',
    costPrice: 2.1,
    sellingPrice: 3.89,
    stockQuantity: 44,
    minStockThreshold: 15,
    supplier: 'Oatly Americas',
    updatedAt: new Date().toISOString(),
  },

  // Pantry & Grains
  {
    id: 'prd_jasmine_rice_5kg',
    barcode: '074523981240',
    name: 'Royal Jasmine Fragrant Rice 5kg',
    category: 'Pantry & Grains',
    unit: 'bag',
    costPrice: 7.8,
    sellingPrice: 12.99,
    stockQuantity: 58,
    minStockThreshold: 15,
    supplier: 'Siam Harvest Direct',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_olive_oil_750ml',
    barcode: '041790001235',
    name: 'Extra Virgin Olive Oil First Cold Press 750ml',
    category: 'Pantry & Grains',
    unit: 'bottle',
    costPrice: 6.9,
    sellingPrice: 10.99,
    stockQuantity: 29,
    minStockThreshold: 10,
    supplier: 'Mediterranean Goods',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_pasta_spaghetti',
    barcode: '076808516104',
    name: 'Durum Semolina Spaghetti No.5 500g',
    category: 'Pantry & Grains',
    unit: 'pack',
    costPrice: 0.95,
    sellingPrice: 1.89,
    stockQuantity: 88,
    minStockThreshold: 25,
    supplier: 'Barilla Pasta Co',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_tuna_can',
    barcode: '048000001234',
    name: 'Wild Chunk Light Tuna in Spring Water 170g',
    category: 'Pantry & Grains',
    unit: 'pcs',
    costPrice: 0.85,
    sellingPrice: 1.59,
    stockQuantity: 112,
    minStockThreshold: 30,
    supplier: 'StarKist Seafood',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_cereal_oats',
    barcode: '016000275270',
    name: 'Honey Nut Toasted Whole Grain Oats 490g',
    category: 'Pantry & Grains',
    unit: 'box',
    costPrice: 2.5,
    sellingPrice: 4.49,
    stockQuantity: 41,
    minStockThreshold: 15,
    supplier: 'General Mills',
    updatedAt: new Date().toISOString(),
  },

  // Snacks & Sweets
  {
    id: 'prd_chips_sea_salt',
    barcode: '084223400123',
    name: 'Kettle Cooked Sea Salt Potato Chips 220g',
    category: 'Snacks & Sweets',
    unit: 'bag',
    costPrice: 1.8,
    sellingPrice: 3.49,
    stockQuantity: 62,
    minStockThreshold: 18,
    supplier: 'Kettle Brand',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_roasted_almonds',
    barcode: '073214001234',
    name: 'California Roasted Sea Salt Almonds 400g',
    category: 'Snacks & Sweets',
    unit: 'pack',
    costPrice: 4.2,
    sellingPrice: 6.99,
    stockQuantity: 27,
    minStockThreshold: 10,
    supplier: 'Blue Diamond Orchards',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_dark_chocolate',
    barcode: '037466014231',
    name: '72% Dark Chocolate Bar with Sea Salt 100g',
    category: 'Snacks & Sweets',
    unit: 'pcs',
    costPrice: 1.6,
    sellingPrice: 2.99,
    stockQuantity: 7, // Low stock for alerts
    minStockThreshold: 15,
    supplier: 'Lindt & Sprüngli',
    updatedAt: new Date().toISOString(),
  },

  // Household & Care
  {
    id: 'prd_dish_soap',
    barcode: '037000123456',
    name: 'Ultra Antibacterial Dish Soap 700ml',
    category: 'Household & Care',
    unit: 'bottle',
    costPrice: 1.9,
    sellingPrice: 3.29,
    stockQuantity: 48,
    minStockThreshold: 16,
    supplier: 'Procter & Gamble',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_paper_towels',
    barcode: '036000291234',
    name: 'Double Roll Paper Towels (6-Pack)',
    category: 'Household & Care',
    unit: 'pack',
    costPrice: 5.2,
    sellingPrice: 8.99,
    stockQuantity: 36,
    minStockThreshold: 12,
    supplier: 'Bounty Paper Goods',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prd_laundry_detergent',
    barcode: '037000987654',
    name: 'Liquid Laundry Detergent Clean Breeze 1.5L',
    category: 'Household & Care',
    unit: 'bottle',
    costPrice: 7.5,
    sellingPrice: 12.49,
    stockQuantity: 24,
    minStockThreshold: 8,
    supplier: 'Tide Household',
    updatedAt: new Date().toISOString(),
  },
];

// Helper to generate recent sales for analytics
export function generateSeedSales(): Sale[] {
  const sales: Sale[] = [];
  const now = new Date();

  // Create transactions spread across the past 7 days, with hourly peaks around 11:00-13:00 and 17:00-19:00
  const paymentOptions: Sale['paymentMethod'][] = ['cash', 'credit_card', 'debit_card', 'e_wallet'];

  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - dayOffset);

    // Number of transactions per day: 12-25
    const txCount = dayOffset === 0 ? 14 : Math.floor(18 + Math.random() * 8);

    for (let i = 0; i < txCount; i++) {
      // Pick realistic grocery hours between 8:00 AM and 21:00 PM
      const hourDistribution = [8, 9, 10, 11, 11, 12, 12, 13, 14, 15, 16, 17, 17, 18, 18, 19, 19, 20];
      const hour = hourDistribution[Math.floor(Math.random() * hourDistribution.length)];
      const minute = Math.floor(Math.random() * 60);

      const txDate = new Date(targetDate);
      txDate.setHours(hour, minute, Math.floor(Math.random() * 60));

      // 1 to 6 items per grocery basket
      const basketSize = Math.floor(1 + Math.random() * 5);
      const items = [];
      let subtotal = 0;

      for (let k = 0; k < basketSize; k++) {
        const randomProduct = INITIAL_PRODUCTS[Math.floor(Math.random() * INITIAL_PRODUCTS.length)];
        const qty = randomProduct.isWeighted
          ? Number((0.4 + Math.random() * 2.2).toFixed(2))
          : Math.floor(1 + Math.random() * 3);
        const itemTotal = Number((qty * randomProduct.sellingPrice).toFixed(2));

        items.push({
          productId: randomProduct.id,
          barcode: randomProduct.barcode,
          name: randomProduct.name,
          category: randomProduct.category,
          unit: randomProduct.unit,
          quantity: qty,
          unitPrice: randomProduct.sellingPrice,
          costPrice: randomProduct.costPrice,
          discountPercent: 0,
          totalPrice: itemTotal,
        });

        subtotal += itemTotal;
      }

      subtotal = Number(subtotal.toFixed(2));
      const taxAmount = Number((subtotal * 0.07).toFixed(2)); // 7% grocery non-exempt / packaged tax
      const totalAmount = Number((subtotal + taxAmount).toFixed(2));

      const paymentMethod = paymentOptions[Math.floor(Math.random() * paymentOptions.length)];
      const amountTendered = paymentMethod === 'cash' ? Math.ceil(totalAmount / 5) * 5 + 5 : totalAmount;
      const changeAmount = Number((amountTendered - totalAmount).toFixed(2));

      const cashier = INITIAL_USERS.filter((u) => u.role === 'cashier')[i % 2];

      sales.push({
        id: `sale_${txDate.getTime()}_${i}`,
        invoiceNumber: `INV-${txDate.getFullYear()}${String(txDate.getMonth() + 1).padStart(2, '0')}${String(txDate.getDate()).padStart(2, '0')}-${String(sales.length + 1).padStart(4, '0')}`,
        cashierId: cashier.id,
        cashierName: cashier.name,
        items,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        paymentMethod,
        amountTendered,
        changeAmount,
        customerName: Math.random() > 0.6 ? 'Walk-in Shopper' : undefined,
        createdAt: txDate.toISOString(),
        status: 'completed',
      });
    }
  }

  return sales;
}

export const INITIAL_SHIFT: CashDrawerShift = {
  id: 'shift_today_1',
  cashierId: 'usr_csh_1',
  cashierName: 'Marco Chen',
  openedAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
  startingCashFloat: 200.0,
  cashSales: 485.5,
  nonCashSales: 1120.8,
  expectedDrawerCash: 685.5,
  status: 'open',
};
