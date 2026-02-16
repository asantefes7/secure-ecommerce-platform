import React, { useState } from 'react';
import { toast } from 'react-toastify';

const Products = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const products = [
    // Sneakers
    {
      _id: '1',
      name: 'Jordan 4 Retro SB Navy',
      description: 'Classic high-top sneaker with premium leather.',
      price: 328.00,
      countInStock: 60,
      imageUrl: 'https://image.goat.com/transform/v1/attachments/product_template_additional_pictures/images/108/196/565/original/1410752_01.jpg.jpeg?action=crop&width=1250',
      category: 'Sneakers',
    },
    {
      _id: '2',
      name: 'Adidas Yeezy Boost 350 V2',
      description: 'Iconic boost cushioning and primeknit upper.',
      price: 220.00,
      countInStock: 8,
      imageUrl: 'https://images.stockx.com/images/Adidas-Yeezy-Boost-350-V2-Core-Black-Red-2017-Product.jpg?fit=fill&bg=FFFFFF&w=700&h=500&auto=format&trim=color',
      category: 'Sneakers',
    },
    {
      _id: '3',
      name: 'Vans Old Skool',
      description: 'Timeless low-top with waffle outsole.',
      price: 85.00,
      countInStock: 20,
      imageUrl: 'https://assets.vans.com/images/t_img/c_fill,g_center,f_auto,h_573,e_unsharp_mask:100,w_458/dpr_2.0/v1755187209/VN0009QC6BT-HERO/Knu-Skool-Shoe-VANS-BlackTrue-White-HERO.png',
      category: 'Sneakers',
    },
    // Watches
    {
      _id: '4',
      name: 'Rolex Submariner Date',
      description: 'Luxury diver watch with ceramic bezel.',
      price: 13500.00,
      countInStock: 20,
      imageUrl: 'https://images.unsplash.com/photo-1734776576464-30551c357fd6?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDMzfHx8ZW58MHx8fHx8',
      category: 'Watches',
    },
    {
      _id: '5',
      name: 'G-Shock MTGB2000YBD2',
      description: 'Tough, slim analog-digital watch.',
      price: 150.00,
      countInStock: 100,
      imageUrl: 'https://www.casio.com/content/dam/casio/product-info/locales/us/en/timepiece/product/watch/M/MT/MTG/mtg-b2000ybd-2a/assets/MTG-B2000YBD-2A.png.transform/product-panel/image.png',
      category: 'Watches',
    },
    {
      _id: '6',
      name: 'Seiko Mod Submariner "Date" Dive',
      description: 'Reliable automatic diver with lume dial.',
      price: 525.00,
      countInStock: 10,
      imageUrl: 'https://somervillewatchcompany.com/cdn/shop/files/seiko-mod-submariner-dive-watch-premium-dial-217155.jpg?v=1724430708&width=1346',
      category: 'Watches',
    },
    // Clothing
    {
      _id: '7',
      name: 'Supreme Box Logo Hoodie Navy',
      description: 'Iconic streetwear hoodie.',
      price: 168.00,
      countInStock: 5,
      imageUrl: 'https://restockar.com/cdn/shop/files/Supreme-Box-Logo-Hoodie-Navy-front.jpg?v=1769307657&width=720',
      category: 'Clothing',
    },
    {
      _id: '8',
      name: 'Patagonia Nano Puff Jacket',
      description: 'Lightweight insulated jacket.',
      price: 249.00,
      countInStock: 12,
      imageUrl: 'https://www.patagonia.com/dw/image/v2/BDJB_PRD/on/demandware.static/-/Sites-patagonia-master/default/dwd54245bb/images/hi-res/84213_BLK.jpg?sw=1920&sh=1920&sfrm=png&q=90&bgcolor=f3f4ef',
      category: 'Clothing',
    },
    {
      _id: '9',
      name: 'Carhartt WIP Detroit Jacket',
      description: 'Durable workwear jacket.',
      price: 180.00,
      countInStock: 18,
      imageUrl: 'https://i5.walmartimages.com/seo/Carhartt-Men-s-Duck-Detroit-Jacket_ba52547b-854a-437e-97d3-e766fe5d4f86.ea5d419359e7a01405921b61646f37ff.jpeg?odnHeight=2000&odnWidth=2000&odnBg=FFFFFF',
      category: 'Clothing',
    },
  ];

  const filteredProducts = products
    .filter(p => selectedCategory === 'All' || p.category === selectedCategory)
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.description.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCartHandler = (product) => {
    let cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
    const existItem = cartItems.find((x) => x._id === product._id);

    if (existItem) {
      cartItems = cartItems.map((x) =>
        x._id === product._id ? { ...x, qty: x.qty + 1 } : x
      );
    } else {
      cartItems = [...cartItems, { ...product, qty: 1 }];
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="container my-5">
      <h2 className="text-center mb-4">Products</h2>
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="input-group">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-outline-secondary" type="button">Search</button>
          </div>
        </div>
        <div className="col-md-6 text-end">
          <div className="btn-group" role="group">
            <button className={`btn ${selectedCategory === 'All' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedCategory('All')}>All</button>
            <button className={`btn ${selectedCategory === 'Sneakers' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedCategory('Sneakers')}>Sneakers</button>
            <button className={`btn ${selectedCategory === 'Watches' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedCategory('Watches')}>Watches</button>
            <button className={`btn ${selectedCategory === 'Clothing' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setSelectedCategory('Clothing')}>Clothing</button>
          </div>
        </div>
      </div>
      <div className="row">
        {filteredProducts.map((product) => (
          <div key={product._id} className="col-md-4 mb-4">
            <div className="card h-100 shadow-sm">
              <img
                src={product.imageUrl}
                className="card-img-top"
                alt={product.name}
                style={{ height: '250px', objectFit: 'cover' }}
              />
              <div className="card-body d-flex flex-column">
                <span className="badge bg-primary mb-2">{product.category}</span>
                <h5 className="card-title">{product.name}</h5>
                <p className="card-text flex-grow-1">{product.description}</p>
                <p className="card-text"><strong>Price:</strong> ${product.price.toFixed(2)}</p>
                <p className="card-text"><strong>In Stock:</strong> {product.countInStock}</p>
                <button
                  onClick={() => addToCartHandler(product)}
                  className="btn btn-primary mt-auto"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;