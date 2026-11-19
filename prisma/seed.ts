import "dotenv/config";
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient, BlogStatus } from '../src/lib/generated/prisma/client';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'bitsphotomart',
  port: parseInt(process.env.DATABASE_PORT || '3306', 10),
  connectionLimit: 20
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // Seed BPM Services
  const services = [
    {
      name: 'Documentary Production',
      slug: 'documentary',
      description: 'Professional documentary filmmaking with animation and storytelling. Tell your story with our Mr. Smart Style production.',
      icon: 'Clapperboard',
      color: 'bg-purple-100 hover:bg-purple-200',
      link: '/documentary',
      cta: 'Request Documentary',
      isActive: true,
      displayOrder: 0,
    },
    {
      name: 'Photo Editing Services',
      slug: 'photo-editing',
      description: 'Professional photo editing, retouching, color correction, and enhancement services for your images.',
      icon: 'Sparkles',
      color: 'bg-pink-100 hover:bg-pink-200',
      link: '/photo-editing',
      cta: 'Get Photo Editing',
      isActive: true,
      displayOrder: 1,
    },
    {
      name: 'Sell to BPM',
      slug: 'sell-to-bpm',
      description: 'Sell your photos to Bits Photo Mart. Earn money from your photography.',
      icon: 'DollarSign',
      color: 'bg-green-100 hover:bg-green-200',
      link: '/sell-to-bpm',
      cta: 'Start Selling',
      isActive: true,
      displayOrder: 2,
    },
    {
      name: 'Subscription Plans',
      slug: 'subscribe',
      description: 'Get exclusive access to premium content, discounts, and special offers with our subscription plans.',
      icon: 'Star',
      color: 'bg-amber-100 hover:bg-amber-200',
      link: '/subscribe',
      cta: 'Subscribe Now',
      isActive: true,
      displayOrder: 3,
    },
    {
      name: 'Story for the Day',
      slug: 'story',
      description: 'Daily inspirational stories and content from our creative community.',
      icon: 'BookOpen',
      color: 'bg-blue-100 hover:bg-blue-200',
      link: '/blog',
      cta: 'Read Stories',
      isActive: true,
      displayOrder: 4,
    },
    {
      name: 'BPM Linkages',
      slug: 'linkages',
      description: 'Connect with creative professionals and businesses in our network.',
      icon: 'Link',
      color: 'bg-indigo-100 hover:bg-indigo-200',
      link: '/bpm-linkages',
      cta: 'Explore Network',
      isActive: true,
      displayOrder: 5,
    },
    {
      name: 'Photography Services',
      slug: 'photography',
      description: 'Book professional photographers for events, portraits, products, and more.',
      icon: 'Camera',
      color: 'bg-red-100 hover:bg-red-200',
      link: '/services',
      cta: 'Book Now',
      isActive: true,
      displayOrder: 6,
    },
    {
      name: 'Drone & Aerial Services',
      slug: 'drone',
      description: 'Professional aerial photography and videography with real-time quotes.',
      icon: 'Plane',
      color: 'bg-slate-100 hover:bg-slate-200',
      link: '/drone-services',
      cta: 'Book Drone Services',
      isActive: true,
      displayOrder: 7,
    },
  ]

  for (const service of services) {
    await prisma.bpmService.upsert({
      where: { slug: service.slug },
      update: service,
      create: service,
    })
  }

  // Seed Service Options for Documentary
  const documentaryService = await prisma.bpmService.findUnique({ where: { slug: 'documentary' } });
  
  if (documentaryService) {
    const serviceOptions = [
      // Animation Styles
      { value: 'NONE', label: 'No Animation', description: 'Standard video without animation', category: 'animation_styles', displayOrder: 0 },
      { value: 'HAND_DRAWN', label: 'Hand Drawn', description: 'Classic 2D hand-drawn animation style', category: 'animation_styles', displayOrder: 1 },
      { value: 'MOTION_GRAPHICS', label: 'Motion Graphics', description: 'Modern animated graphics and text', category: 'animation_styles', displayOrder: 2 },
      { value: 'WHITEBOARD', label: 'Whiteboard', description: 'Animated whiteboard drawing style', category: 'animation_styles', displayOrder: 3 },
      { value: 'INFOGRAPHIC', label: 'Infographic', description: 'Data visualization and info-graphics', category: 'animation_styles', displayOrder: 4 },
      { value: 'STOP_MOTION', label: 'Stop Motion', description: 'Frame-by-frame animation', category: 'animation_styles', displayOrder: 5 },
      { value: 'ANIMATION_3D', label: '3D Animation', description: 'Three-dimensional animated content', category: 'animation_styles', displayOrder: 6 },
      { value: 'MR_SMART_STYLE', label: 'Mr Smart Style', description: 'Our signature animated storytelling', category: 'animation_styles', displayOrder: 7 },
      
      // Delivery Formats
      { value: 'MP4', label: 'MP4', description: 'Most compatible format', category: 'delivery_formats', displayOrder: 0 },
      { value: 'MOV', label: 'MOV', description: 'Apple QuickTime format', category: 'delivery_formats', displayOrder: 1 },
      { value: 'AVI', label: 'AVI', description: 'Windows video format', category: 'delivery_formats', displayOrder: 2 },
      { value: 'MKV', label: 'MKV', description: 'Matroska video format', category: 'delivery_formats', displayOrder: 3 },
      { value: 'DVD', label: 'DVD', description: 'Physical DVD delivery', category: 'delivery_formats', displayOrder: 4 },
      { value: 'BLU_RAY', label: 'Blu-Ray', description: 'High-definition physical media', category: 'delivery_formats', displayOrder: 5 },
      { value: 'RAW', label: 'RAW', description: 'Uncompressed footage', category: 'delivery_formats', displayOrder: 6 },
      
      // Durations
      { value: '1', label: '1-2 minutes', description: 'Short promotional content', category: 'durations', displayOrder: 0 },
      { value: '3', label: '3-5 minutes', description: 'Standard documentary short', category: 'durations', displayOrder: 1 },
      { value: '5', label: '5-10 minutes', description: 'Medium-length feature', category: 'durations', displayOrder: 2 },
      { value: '10', label: '10-20 minutes', description: 'Extended documentary', category: 'durations', displayOrder: 3 },
      { value: '20', label: '20+ minutes', description: 'Full-length documentary', category: 'durations', displayOrder: 4 },
      
      // Coverage Types
      { value: 'EVENT_COVERAGE', label: 'Event Coverage', description: 'Full event documentation (weddings, conferences, parties)', category: 'coverage_types', displayOrder: 0 },
      { value: 'INTERVIEW', label: 'Interview', description: 'Professional interview filming with proper lighting', category: 'coverage_types', displayOrder: 1 },
      { value: 'B_ROLL', label: 'B-Roll Footage', description: 'Supplemental footage for your documentary', category: 'coverage_types', displayOrder: 2 },
      { value: 'LOCATION_SHOOT', label: 'Location Shoot', description: 'Film at specific locations you specify', category: 'coverage_types', displayOrder: 3 },
      { value: 'PRODUCT_SHOT', label: 'Product/Service Shoot', description: 'Showcase your products or services', category: 'coverage_types', displayOrder: 4 },
      { value: 'PROMOTIONAL', label: 'Promotional Video', description: 'Marketing and promotional content', category: 'coverage_types', displayOrder: 5 },
      { value: 'MEMORIAL', label: 'Memorial/Tribute', description: 'Commemorative documentary for loved ones', category: 'coverage_types', displayOrder: 6 },
      { value: 'CORPORATE', label: 'Corporate Documentary', description: 'Company history, training, or overview videos', category: 'coverage_types', displayOrder: 7 },
      
      // Coverage Durations
      { value: '1', label: '1 hour', description: 'Short session', category: 'coverage_durations', displayOrder: 0 },
      { value: '2', label: '2 hours', description: 'Standard session', category: 'coverage_durations', displayOrder: 1 },
      { value: '4', label: '4 hours', description: 'Half day coverage', category: 'coverage_durations', displayOrder: 2 },
      { value: '8', label: '8 hours', description: 'Full day coverage', category: 'coverage_durations', displayOrder: 3 },
      { value: '12', label: '12+ hours', description: 'Multiple days', category: 'coverage_durations', displayOrder: 4 },
    ];

    for (const option of serviceOptions) {
      await prisma.serviceOption.upsert({
        where: { 
          value_category_bpmServiceId: {
            value: option.value,
            category: option.category,
            bpmServiceId: documentaryService.id
          }
        },
        update: option,
        create: {
          ...option,
          bpmServiceId: documentaryService.id,
        },
      });
    }
  }

  // Seed Service Options for Photo Editing
  const photoEditingService = await prisma.bpmService.findUnique({ where: { slug: 'photo-editing' } });
  
  if (photoEditingService) {
    const photoEditingOptions = [
      // Photo Editing Levels
      { value: 'BASIC', label: 'Basic Editing', description: 'Simple adjustments (brightness, contrast, crop)', category: 'photo_editing_levels', displayOrder: 0, price: 2000 },
      { value: 'ADVANCED', label: 'Advanced Editing', description: 'Color grading, retouching, and enhancement', category: 'photo_editing_levels', displayOrder: 1, price: 5000 },
      { value: 'CUSTOM', label: 'Custom Editing', description: 'Special effects and custom requests', category: 'photo_editing_levels', displayOrder: 2, price: 10000 },
      
      // Add-ons / Service Options
      { value: 'CROP', label: 'Crop & Resize', description: 'Crop to specific dimensions or aspect ratio', category: 'add_ons', displayOrder: 0, price: 500 },
      { value: 'ROTATE', label: 'Rotate & Flip', description: 'Rotate, flip, or straighten images', category: 'add_ons', displayOrder: 1, price: 500 },
      { value: 'RESIZE', label: 'Resolution Change', description: 'Change resolution for print or web', category: 'add_ons', displayOrder: 2, price: 500 },
      { value: 'COLOR_CORRECTION', label: 'Color Correction', description: 'Adjust colors, saturation, and white balance', category: 'add_ons', displayOrder: 3, price: 1500 },
      { value: 'REMOVE_BACKGROUND', label: 'Remove Background', description: 'Remove or replace background', category: 'add_ons', displayOrder: 4, price: 3000 },
      { value: 'WATERMARK', label: 'Add/Remove Watermark', description: 'Add or professionally remove watermarks', category: 'add_ons', displayOrder: 5, price: 1500 },
      { value: 'OVERLAY', label: 'Add Overlay/Text', description: 'Add text, graphics, or overlays', category: 'add_ons', displayOrder: 6, price: 2000 },
      { value: 'EMBOSS', label: 'Emboss/Engrave Effect', description: 'Create 3D emboss or engraving effect', category: 'add_ons', displayOrder: 7, price: 2500 },
      { value: 'RESTORE_OLD_PHOTO', label: 'Restore Old Photo', description: 'Restore damaged or old photographs', category: 'add_ons', displayOrder: 8, price: 5000 },
      { value: 'SKIN_RETOUCH', label: 'Skin Retouching', description: 'Professional portrait retouching', category: 'add_ons', displayOrder: 9, price: 2000 },
      { value: 'OBJECT_REMOVAL', label: 'Object Removal', description: 'Remove unwanted objects from photos', category: 'add_ons', displayOrder: 10, price: 3500 },
    ];

    for (const option of photoEditingOptions) {
      await prisma.serviceOption.upsert({
        where: { 
          value_category_bpmServiceId: {
            value: option.value,
            category: option.category,
            bpmServiceId: photoEditingService.id
          }
        },
        update: option,
        create: {
          ...option,
          bpmServiceId: photoEditingService.id,
        },
      });
    }
  }

  // Seed Job Types (for the services page form)
  // Note: These are global options not tied to any specific BPM service

  // Seed Service Options for Drone Services
  const droneService = await prisma.bpmService.findUnique({ where: { slug: 'drone' } });
  
  if (droneService) {
    const droneOptions = [
      // Drone Types
      { value: 'CONSUMER', label: 'Consumer Drone', description: 'DJI Mavic, Mini series', category: 'drone_types', displayOrder: 0 },
      { value: 'PRO', label: 'Professional Drone', description: 'DJI Inspire, Phantom Pro', category: 'drone_types', displayOrder: 1 },
      { value: 'CINEMA', label: 'Cinema Drone', description: 'DJI Matrice, Ronin', category: 'drone_types', displayOrder: 2 },

      // Service Types
      { value: 'AERIAL_PHOTO', label: 'Aerial Photography', description: 'High-resolution photos from above', category: 'service_types', displayOrder: 0 },
      { value: 'AERIAL_VIDEO', label: 'Aerial Videography', description: '4K video capture', category: 'service_types', displayOrder: 1 },
      { value: 'PROPERTY_INSPECTION', label: 'Property Inspection', description: 'Roof, construction, real estate', category: 'service_types', displayOrder: 2 },
      { value: 'SURVEY_MAPPING', label: 'Survey & Mapping', description: 'Land surveying, topographical', category: 'service_types', displayOrder: 3 },
      { value: 'EVENT_COVERAGE', label: 'Event Coverage', description: 'Weddings, parties, corporate events', category: 'service_types', displayOrder: 4 },
      { value: 'LIVE_STREAM', label: 'Live Streaming', description: 'Real-time aerial broadcast', category: 'service_types', displayOrder: 5 },

      // Locations
      { value: 'NAIROBI', label: 'Nairobi & Surroundings', description: 'Within Nairobi metro area', category: 'locations', displayOrder: 0 },
      { value: 'CENTRAL', label: 'Central Kenya', description: 'Kiambu, Nakuru, etc. (1.2x)', category: 'locations', displayOrder: 1 },
      { value: 'COAST', label: 'Coastal Region', description: 'Mombasa, Malindi (1.5x)', category: 'locations', displayOrder: 2 },
      { value: 'WESTERN', label: 'Western Kenya', description: 'Kisumu, Eldoret (1.4x)', category: 'locations', displayOrder: 3 },
      { value: 'REMOTE', label: 'Remote Areas', description: 'Outside major cities (1.8x)', category: 'locations', displayOrder: 4 },

      // Durations
      { value: '1', label: '1 Hour', description: '1 hour session', category: 'durations', displayOrder: 0 },
      { value: '2', label: '2 Hours', description: '2 hour session (5% discount)', category: 'durations', displayOrder: 1 },
      { value: '4', label: 'Half Day (4 Hours)', description: '4 hour session (10% discount)', category: 'durations', displayOrder: 2 },
      { value: '8', label: 'Full Day (8 Hours)', description: '8 hour session (15% discount)', category: 'durations', displayOrder: 3 },

      // Add-ons
      { value: 'PROFESSIONAL_EDITING', label: 'Professional Editing', description: 'Color grading, cropping, enhancements', category: 'add_ons', displayOrder: 0 },
      { value: 'RUSH_DELIVERY', label: 'Rush Delivery', description: 'Same-day or next-day delivery', category: 'add_ons', displayOrder: 1 },
      { value: 'DRONE_INSURANCE', label: 'Drone Insurance', description: 'Coverage for equipment and liability', category: 'add_ons', displayOrder: 2 },
      { value: 'SECOND_OPERATOR', label: 'Second Operator', description: 'Dedicated camera operator', category: 'add_ons', displayOrder: 3 },
    ];

    for (const option of droneOptions) {
      await prisma.serviceOption.upsert({
        where: {
          value_category_bpmServiceId: {
            value: option.value,
            category: option.category,
            bpmServiceId: droneService.id
          }
        },
        update: {
          ...option,
          bpmServiceId: droneService.id
        },
        create: {
          ...option,
          bpmServiceId: droneService.id,
        },
      });
    }
  }

  // Seed Job Types (for the services page form)
  // Note: These are global options not tied to any specific BPM service
  const jobTypes = [
    { value: 'PHOTOGRAPHY', label: 'Photography', description: 'Professional photo shoots', category: 'job_types', displayOrder: 0 },
    { value: 'VIDEOGRAPHY', label: 'Videography', description: 'Video production services', category: 'job_types', displayOrder: 1 },
    { value: 'DRONE', label: 'Drone/Aerial', description: 'Aerial photography & videography', category: 'job_types', displayOrder: 2 },
    { value: 'DOCUMENTARY', label: 'Documentary', description: 'Documentary film production', category: 'job_types', displayOrder: 3 },
    { value: 'EVENT_COVERAGE', label: 'Event Coverage', description: 'Weddings, parties, corporate events', category: 'job_types', displayOrder: 4 },
    { value: 'PRODUCT_SHOOT', label: 'Product Shoot', description: 'E-commerce product photography', category: 'job_types', displayOrder: 5 },
    { value: 'CUSTOM', label: 'Custom Request', description: 'Tell us what you need', category: 'job_types', displayOrder: 6 },
  ];

  // Delete existing job types first (to avoid unique constraint issues)
  await prisma.serviceOption.deleteMany({
    where: {
      category: 'job_types',
    },
  }).catch(() => {
    // Ignore errors if records don't exist
  });

  // Create job types - use createMany since they're global (bpmServiceId is null)
  await prisma.serviceOption.createMany({
    data: jobTypes.map(jobType => ({
      value: jobType.value,
      label: jobType.label,
      description: jobType.description,
      category: jobType.category,
      displayOrder: jobType.displayOrder,
      bpmServiceId: null, // Global job types don't belong to a specific service
    })),
    skipDuplicates: true,
  });

  console.log('✅ BPM Services seeded successfully!')

  // Seed Blog Posts
  const blogPosts = [
    {
      title: 'Welcome to Bits Photo Mart',
      slug: 'welcome-to-bits-photo-mart',
      content: `Welcome to Bits Photo Mart, your premier destination for discovering and purchasing exceptional photography and videography. Our platform connects talented photographers with businesses and individuals seeking premium visual content.

At Bits Photo Mart, we understand the power of visual storytelling. Whether you're looking for stunning stock photos, need a professional photographer for your event, or want to explore the world of documentary filmmaking, we've got you covered.

Our network of verified photographers and videographers spans across Kenya, ensuring that you have access to quality creative services no matter where you are. From Nairobi to Mombasa, from Kisumu to Nakuru, our creative professionals are ready to bring your vision to life.

What sets us apart:
- Verified professionals
- Nationwide coverage
- Competitive pricing
- Quality assurance
- Easy booking process

Join thousands of satisfied clients who have found their perfect creative partner through Bits Photo Mart.`,
      excerpt: 'Discover the premier marketplace for high-quality photography and videography in Kenya.',
      author: 'BPM Team',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date('2026-02-15'),
    },
    {
      title: 'Top 10 Photography Tips for Beginners',
      slug: 'photography-tips-beginners',
      content: `Starting your photography journey? Here are our top 10 tips to help you capture better photos from day one.

1. **Master the Exposure Triangle**
   Understanding aperture, shutter speed, and ISO is fundamental. These three elements control how light enters your camera and affect your image's brightness and quality.

2. **Use the Rule of Thirds**
   Imagine your frame divided into a 3x3 grid. Place your subject along these lines or at their intersections for more dynamic compositions.

3. **Lighting is Everything**
   The golden hour (just after sunrise or before sunset) provides soft, warm light that's perfect for portraits and landscapes.

4. **Keep Your Camera Steady**
   Use a tripod or stabilize your camera against a solid surface. Shaky hands can ruin otherwise perfect shots.

5. **Learn to See**
   Train your eye to notice light, shadows, patterns, and compositions in everyday scenes.

6. **Practice Daily**
   The more you shoot, the better you become. Challenge yourself to take one great photo every day.

7. **Study Others' Work**
   Analyze photos you admire. What makes them work? Apply those lessons to your own photography.

8. **Don't Fear Manual Mode**
   While auto mode is convenient, shooting in manual gives you creative control.

9. **Edit Your Photos**
   Post-processing is part of the creative process. Learn basic editing in tools like Lightroom or Photoshop.

10. **Join a Community**
    Connect with other photographers for feedback, inspiration, and learning opportunities.

Happy shooting!`,
      excerpt: 'Learn the essential tips and tricks to improve your photography skills.',
      author: 'John Kamau',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date('2026-02-10'),
    },
    {
      title: 'The Rise of Drone Photography in Kenya',
      slug: 'drone-photography-kenya',
      content: `Drone photography has transformed the visual industry in Kenya, opening up new possibilities for filmmakers, photographers, and businesses alike.

**From Hollywood to Kenyan Skies**
What was once reserved for big-budget productions is now accessible to businesses and individuals across Kenya. Drone technology has become more affordable, and the results speak for themselves.

**Applications Across Industries**
- **Real Estate**: Aerial property shots showcase developments like never before
- **Events**: Capture breathtaking wedding and corporate event footage
- **Agriculture**: Monitor crops and assess land from above
- **Construction**: Track project progress with regular aerial updates
- **Tourism**: Showcase Kenya's stunning landscapes

**Regulatory Framework**
The Kenya Civil Aviation Authority has established guidelines for drone operations. All professional drone operators must be licensed, and there are designated no-fly zones near airports and government facilities.

**The Future is Flying**
As technology advances, we can expect even more sophisticated drones with better cameras, longer flight times, and enhanced AI capabilities. The sky truly is the limit!

At Bits Photo Mart, we connect you with certified drone professionals across Kenya. Whether you need aerial photography for your business or want to capture special moments from a unique perspective, our network of drone experts is ready to help.`,
      excerpt: 'Explore how drone photography is transforming the visual industry.',
      author: 'Sarah Ochieng',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date('2026-02-05'),
    },
    {
      title: 'Behind the Scenes: Event Photography',
      slug: 'behind-scenes-event-photography',
      content: `Ever wondered what goes into capturing the perfect event? Let us take you behind the scenes of a professional event photography shoot.

**Preparation is Key**
Before the event, we scout the venue, check lighting conditions, and plan our shots. We discuss the schedule with the event organizer to ensure we capture all important moments.

**Equipment Check**
Professional event photographers carry multiple cameras, various lenses (wide for group shots, telephoto for candid moments), flash units, and spare batteries and memory cards.

**The Day of the Event**
- **Arrival**: We arrive early to set up and test lighting
- **Key Moments**: We position ourselves strategically for speeches, cake cutting, and other important events
- **Candid Shots**: We blend in with guests to capture natural, unposed moments
- **Group Photos**: We coordinate and direct formal group shots efficiently

**Post-Production**
After the event, thousands of photos undergo careful selection and editing. Each image is color-corrected, and the best shots are enhanced for delivery.

**Delivery**
Within days, clients receive their professionally edited gallery, ready to share and treasure.

At Bits Photo Mart, our event photographers bring years of experience and professional equipment to make your event memories last forever.`,
      excerpt: 'What happens during a professional event photography shoot.',
      author: 'Mike Wanjala',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date('2026-01-28'),
    },
    {
      title: 'Why Professional Photo Editing Matters',
      slug: 'why-professional-photo-editing-matters',
      content: `In today's visual-first world, professional photo editing can make the difference between an average image and a stunning one.

**The Magic of Post-Processing**
Professional photo editing goes beyond simple filters. It's about enhancing the original vision while maintaining authenticity.

**What Professional Editing Includes**:
- **Color Correction**: Ensuring accurate, vibrant colors
- **Exposure Adjustment**: Balancing highlights and shadows
- **Cropping and Composition**: Perfecting the frame
- **Retouching**: Removing distractions and blemishes
- **Noise Reduction**: Cleaning up low-light shots
- **Sharpening**: Enhancing detail and clarity

**Industry Applications**
- **E-commerce**: Product photos that sell
- **Corporate**: Professional headshots and marketing materials
- **Events**: Enhancing precious memories
- **Real Estate**: Making properties look their best

**DIY vs Professional**
While smartphone apps offer basic editing, professional editors bring expertise, professional-grade software, and an artistic eye that elevates your images.

**Our Services**
At Bits Photo Mart, we offer professional photo editing services to transform your images. Our team uses industry-standard tools to deliver stunning results.`,
      excerpt: 'Discover the importance of professional photo editing for your images.',
      author: 'Emily Nyongesa',
      status: BlogStatus.PUBLISHED,
      publishedAt: new Date('2026-01-20'),
    },
  ];

  // Create blog posts
  for (const post of blogPosts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: post,
      create: post,
    });
  }

  console.log('✅ Blog posts seeded successfully!')

  // Seed Admin User
  async function seedAdmin() {
    const bcrypt = await import('bcryptjs');
    
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@bitsphotomart.com' },
      update: {},
      create: {
        email: 'admin@bitsphotomart.com',
        name: 'Admin User',
        phone: '+254700000001',
        password: adminPassword,
        role: 'ADMIN',
        isVerified: true,
      },
    });

    // Create admin profile
    await prisma.adminProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        department: 'Administration',
        title: 'System Administrator',
      },
    });

    console.log('✅ Admin user seeded successfully!');
    console.log('   Email: admin@bitsphotomart.com');
    console.log('   Password: admin123');
  }

  await seedAdmin();

  // Seed Marketer
  async function seedMarketer() {
    const bcrypt = await import('bcryptjs');
    
    // Create a marketer user
    const marketerPassword = await bcrypt.hash('marketer123', 12);
    const marketerUser = await prisma.user.upsert({
      where: { email: 'marketer@bitsphotomart.com' },
      update: {},
      create: {
        email: 'marketer@bitsphotomart.com',
        name: 'John Marketer',
        phone: '+254700000000',
        password: marketerPassword,
        role: 'MARKETER',
        isVerified: true,
      },
    });

    // Create marketer profile
    await prisma.marketerProfile.upsert({
      where: { userId: marketerUser.id },
      update: {},
      create: {
        userId: marketerUser.id,
        department: 'Marketing',
        title: 'Affiliate Partner',
        commissionRate: 10,
        targetSales: 50000,
        status: 'ACTIVE',
      },
    });

    console.log('✅ Marketer seeded successfully!');
    console.log('   Email: marketer@bitsphotomart.com');
    console.log('   Password: marketer123');
  }

  await seedMarketer();
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
