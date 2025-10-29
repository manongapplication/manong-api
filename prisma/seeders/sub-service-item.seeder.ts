import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class SubServiceItemSeeder {
  async run() {
    // Fetch service items
    const plumbing = await prisma.serviceItem.findFirst({
      where: { title: 'Plumbing' },
    });
    const electrical = await prisma.serviceItem.findFirst({
      where: { title: 'Electrical' },
    });
    const carpentry = await prisma.serviceItem.findFirst({
      where: { title: 'Carpentry' },
    });
    const painting = await prisma.serviceItem.findFirst({
      where: { title: 'Painting' },
    });
    const appliance = await prisma.serviceItem.findFirst({
      where: { title: 'Appliance Repair' },
    });
    const security = await prisma.serviceItem.findFirst({
      where: { title: 'Security' },
    });
    const homeMaintenance = await prisma.serviceItem.findFirst({
      where: { title: 'Home Maintenance' },
    });

    await prisma.subServiceItem.createMany({
      data: [
        // Plumbing Services
        {
          serviceItemId: plumbing!.id,
          title: 'Leak Repair',
          description:
            'Professional repair of water leaks in pipes, faucets, and fixtures. Includes diagnosis, replacement of damaged components, and testing to ensure proper water flow.',
          iconName: 'water_drop',
          cost: 200,
          fee: 300,
          gross: 500,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Pipe Installation',
          description:
            'Complete installation of new water supply and drainage pipes. Includes material supply, proper fitting, and connection to existing plumbing systems.',
          iconName: 'plumbing',
          cost: 400,
          fee: 600,
          gross: 1000,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Toilet Repair & Installation',
          description:
            'Repair or replace broken toilets for better functionality.',
          iconName: 'wc',
          cost: 250,
          fee: 150,
          gross: 400,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Water Heater Repair & Installation',
          description:
            'Service or replace water heaters to ensure reliable hot water.',
          iconName: 'thermostat',
          cost: 400,
          fee: 200,
          gross: 600,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Sump Pump Installation & Repair',
          description:
            'Install or repair sump pumps to prevent basement flooding.',
          iconName: 'water_damage',
          cost: 300,
          fee: 180,
          gross: 480,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Faucet Repair/Replacement',
          description:
            'Repair or replacement of leaking or damaged faucets. Includes diagnosis, installation of new parts, and ensuring proper water flow.',
          iconName: 'tap',
          cost: 200,
          fee: 300,
          gross: 500,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Sewer Line Inspection/Repair',
          description:
            'Inspection and repair of sewer lines to prevent blockages, leaks, and foul odors. May include camera inspection and pipe replacement if needed.',
          iconName: 'search',
          cost: 500,
          fee: 400,
          gross: 900,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Shower & Bathtub Installation/Repair',
          description:
            'Installation or repair of showers and bathtubs, including plumbing connections, sealing, and leak prevention.',
          iconName: 'shower',
          cost: 800,
          fee: 600,
          gross: 1400,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Garbage Disposal Repair/Installation',
          description:
            'Repair or installation of garbage disposal units to ensure efficient kitchen waste management and drainage.',
          iconName: 'delete',
          cost: 300,
          fee: 300,
          gross: 600,
        },

        // Electrical Services
        {
          serviceItemId: electrical!.id,
          title: 'Outlet Replacement',
          description:
            'Safe replacement of electrical outlets and switches. Includes removal of old fixtures, proper wiring, and installation of new outlets with safety testing.',
          iconName: 'power',
          cost: 150,
          fee: 250,
          gross: 400,
        },
        {
          serviceItemId: electrical!.id,
          title: 'Lighting Setup',
          description:
            'Professional installation of indoor and outdoor lighting fixtures. Includes wiring, mounting, and configuration of switches and dimmers.',
          iconName: 'lightbulb',
          cost: 300,
          fee: 400,
          gross: 700,
        },

        // Carpentry Services
        {
          serviceItemId: carpentry!.id,
          title: 'Door & Cabinet',
          description:
            'Installation and repair of doors and cabinet systems. Includes hanging, alignment, hardware installation, and finishing touches.',
          iconName: 'door_front',
          cost: 120,
          fee: 180,
          gross: 300,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Shelving Install',
          description:
            'Custom shelving installation for storage solutions. Includes measuring, cutting, mounting, and securing shelves to walls or existing structures.',
          iconName: 'shelves',
          cost: 120,
          fee: 150,
          gross: 270,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Furniture Repair',
          description:
            'Restoration and repair of wooden furniture. Includes fixing joints, replacing damaged parts, and refinishing surfaces.',
          iconName: 'chair',
          cost: 120,
          fee: 160,
          gross: 280,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Trim/Molding',
          description:
            'Installation of decorative trim and molding around doors, windows, and baseboards. Includes cutting, fitting, and finishing work.',
          iconName: 'format_shapes',
          cost: 120,
          fee: 140,
          gross: 260,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Wood Repairs',
          description:
            'General wood repair services including patching holes, replacing damaged boards, and structural wood maintenance.',
          iconName: 'handyman',
          cost: 120,
          fee: 130,
          gross: 250,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Door Fixing',
          description:
            'Comprehensive door repair services including alignment, hardware replacement, weatherstripping, and lock installation.',
          iconName: 'door_sliding',
          cost: 300,
          fee: 200,
          gross: 500,
        },

        // Painting Services
        {
          serviceItemId: painting!.id,
          title: 'Room Repaint',
          description:
            'Complete room painting service including surface preparation, primer application, and two coats of premium paint. Includes cleanup and furniture protection.',
          iconName: 'brush',
          cost: 500,
          fee: 700,
          gross: 1200,
        },

        // Appliance Repair Services
        {
          serviceItemId: appliance!.id,
          title: 'AC Repair',
          description:
            'Air conditioning system diagnosis and repair. Includes troubleshooting, component replacement, refrigerant servicing, and performance testing.',
          iconName: 'ac_unit',
          cost: 600,
          fee: 400,
          gross: 1000,
        },

        // Security Services
        {
          serviceItemId: security!.id,
          title: 'CCTV Setup',
          description:
            'Complete CCTV surveillance system installation including camera mounting, wiring, DVR/NVR setup, and mobile app configuration for remote monitoring.',
          iconName: 'videocam',
          cost: 800,
          fee: 1200,
          gross: 2000,
        },

        // Home Maintenance Services
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Dryer Vent Cleaning',
          description:
            'Thorough cleaning of dryer vents to improve efficiency, prevent fires, and extend appliance lifespan.',
          iconName: 'air',
          cost: 80,
          fee: 120,
          gross: 200,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Chimney Cleaning & Inspection',
          description:
            'Professional chimney sweeping and safety inspection to prevent blockages and ensure proper ventilation.',
          iconName: 'fireplace',
          cost: 100,
          fee: 150,
          gross: 250,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Chimney Repair',
          description:
            'Repair of damaged bricks, mortar joints, and chimney caps to restore safety and functionality.',
          iconName: 'build',
          cost: 200,
          fee: 200,
          gross: 400,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Gutter Cleaning',
          description:
            'Removal of leaves, debris, and blockages from gutters and downspouts to ensure proper water drainage.',
          iconName: 'cleaning_services',
          cost: 80,
          fee: 120,
          gross: 200,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Gutter Repair & Installation',
          description:
            'Repair of leaking or damaged gutters and installation of new systems to improve water flow.',
          iconName: 'home_repair_service',
          cost: 150,
          fee: 180,
          gross: 330,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Pressure Washing',
          description:
            'High-pressure cleaning for driveways, decks, siding, and other surfaces to remove dirt, grime, and mold.',
          iconName: 'water',
          cost: 100,
          fee: 150,
          gross: 250,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Window Cleaning',
          description:
            'Interior and exterior window washing for streak-free clarity and improved curb appeal.',
          iconName: 'window',
          cost: 60,
          fee: 90,
          gross: 150,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Handyman Services',
          description:
            'General repair and maintenance tasks for home upkeep, including minor fixes and installations.',
          iconName: 'handyman',
          cost: 80,
          fee: 120,
          gross: 200,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Furniture Assembly',
          description:
            'Assembly of flat-pack and custom furniture, including bed frames, desks, cabinets, and shelves.',
          iconName: 'inventory_2',
          cost: 60,
          fee: 100,
          gross: 160,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Home Weatherproofing',
          description:
            'Sealing gaps, insulating windows/doors, and installing weatherstripping to improve energy efficiency.',
          iconName: 'shield',
          cost: 120,
          fee: 180,
          gross: 300,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Garage Door Repair & Installation',
          description:
            'Repair and installation of garage doors, openers, and related hardware.',
          iconName: 'garage',
          cost: 300,
          fee: 250,
          gross: 550,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Fence Repair & Installation',
          description:
            'Repair and construction of wood, vinyl, and metal fencing for security and privacy.',
          iconName: 'fence',
          cost: 200,
          fee: 300,
          gross: 500,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Deck Repair & Installation',
          description:
            'Repair, staining, and construction of wooden decks for durability and aesthetics.',
          iconName: 'deck',
          cost: 250,
          fee: 350,
          gross: 600,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Pool Maintenance & Repair',
          description:
            'Cleaning, chemical balancing, and repair of pool systems for safe and clear water.',
          iconName: 'pool',
          cost: 150,
          fee: 200,
          gross: 350,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Appliance Installation',
          description:
            'Installation of major household appliances including washers, dryers, refrigerators, and ovens.',
          iconName: 'kitchen',
          cost: 100,
          fee: 150,
          gross: 250,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Appliance Repair',
          description:
            'Repair services for malfunctioning household appliances, restoring them to working condition.',
          iconName: 'settings',
          cost: 120,
          fee: 180,
          gross: 300,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Smoke & Carbon Monoxide Detector Installation',
          description:
            'Installation and testing of smoke and CO detectors for improved home safety.',
          iconName: 'smoke_detector',
          cost: 50,
          fee: 80,
          gross: 130,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Smart Home Device Installation',
          description:
            'Setup of smart home devices such as thermostats, cameras, lighting systems, and security devices.',
          iconName: 'smart_home',
          cost: 80,
          fee: 120,
          gross: 200,
        },
      ],
    });

    console.log('Sub-service items seeded successfully!');
  }
}
