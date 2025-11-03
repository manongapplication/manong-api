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
          iconName: 'mdi:water',
          cost: 200,
          fee: 300,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Pipe Installation',
          description:
            'Complete installation of new water supply and drainage pipes. Includes material supply, proper fitting, and connection to existing plumbing systems.',
          iconName: 'mdi:pipe',
          cost: 400,
          fee: 600,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Toilet Repair & Installation',
          description:
            'Repair or replace broken toilets for better functionality.',
          iconName: 'mdi:toilet',
          cost: 250,
          fee: 150,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Water Heater Repair & Installation',
          description:
            'Service or replace water heaters to ensure reliable hot water.',
          iconName: 'mdi:water-boiler',
          cost: 400,
          fee: 200,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Sump Pump Installation & Repair',
          description:
            'Install or repair sump pumps to prevent basement flooding.',
          iconName: 'mdi:water-pump',
          cost: 300,
          fee: 180,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Faucet Repair/Replacement',
          description:
            'Repair or replacement of leaking or damaged faucets. Includes diagnosis, installation of new parts, and ensuring proper water flow.',
          iconName: 'mdi:faucet',
          cost: 200,
          fee: 300,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Sewer Line Inspection/Repair',
          description:
            'Inspection and repair of sewer lines to prevent blockages, leaks, and foul odors. May include camera inspection and pipe replacement if needed.',
          iconName: 'mdi:magnify',
          cost: 500,
          fee: 400,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Shower & Bathtub Installation/Repair',
          description:
            'Installation or repair of showers and bathtubs, including plumbing connections, sealing, and leak prevention.',
          iconName: 'mdi:shower',
          cost: 800,
          fee: 600,
        },
        {
          serviceItemId: plumbing!.id,
          title: 'Garbage Disposal Repair/Installation',
          description:
            'Repair or installation of garbage disposal units to ensure efficient kitchen waste management and drainage.',
          iconName: 'mdi:delete',
          cost: 300,
          fee: 300,
        },

        // Electrical Services
        {
          serviceItemId: electrical!.id,
          title: 'Outlet Replacement',
          description:
            'Safe replacement of electrical outlets and switches. Includes removal of old fixtures, proper wiring, and installation of new outlets with safety testing.',
          iconName: 'mdi:power-plug',
          cost: 150,
          fee: 250,
        },
        {
          serviceItemId: electrical!.id,
          title: 'Lighting Setup',
          description:
            'Professional installation of indoor and outdoor lighting fixtures. Includes wiring, mounting, and configuration of switches and dimmers.',
          iconName: 'mdi:lightbulb',
          cost: 300,
          fee: 400,
        },

        // Carpentry Services
        {
          serviceItemId: carpentry!.id,
          title: 'Door & Cabinet',
          description:
            'Installation and repair of doors and cabinet systems. Includes hanging, alignment, hardware installation, and finishing touches.',
          iconName: 'mdi:door',
          cost: 120,
          fee: 180,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Shelving Install',
          description:
            'Custom shelving installation for storage solutions. Includes measuring, cutting, mounting, and securing shelves to walls or existing structures.',
          iconName: 'mdi:bookshelf',
          cost: 120,
          fee: 150,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Furniture Repair',
          description:
            'Restoration and repair of wooden furniture. Includes fixing joints, replacing damaged parts, and refinishing surfaces.',
          iconName: 'mdi:sofa',
          cost: 120,
          fee: 160,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Trim/Molding',
          description:
            'Installation of decorative trim and molding around doors, windows, and baseboards. Includes cutting, fitting, and finishing work.',
          iconName: 'mdi:square-outline',
          cost: 120,
          fee: 140,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Wood Repairs',
          description:
            'General wood repair services including patching holes, replacing damaged boards, and structural wood maintenance.',
          iconName: 'mdi:tools',
          cost: 120,
          fee: 130,
        },
        {
          serviceItemId: carpentry!.id,
          title: 'Door Fixing',
          description:
            'Comprehensive door repair services including alignment, hardware replacement, weatherstripping, and lock installation.',
          iconName: 'mdi:door-open',
          cost: 300,
          fee: 200,
        },

        // Painting Services
        {
          serviceItemId: painting!.id,
          title: 'Room Repaint',
          description:
            'Complete room painting service including surface preparation, primer application, and two coats of premium paint. Includes cleanup and furniture protection.',
          iconName: 'mdi:brush',
          cost: 500,
          fee: 700,
        },

        // Appliance Repair Services
        {
          serviceItemId: appliance!.id,
          title: 'AC Repair',
          description:
            'Air conditioning system diagnosis and repair. Includes troubleshooting, component replacement, refrigerant servicing, and performance testing.',
          iconName: 'mdi:air-conditioner',
          cost: 600,
          fee: 400,
        },

        // Security Services
        {
          serviceItemId: security!.id,
          title: 'CCTV Setup',
          description:
            'Complete CCTV surveillance system installation including camera mounting, wiring, DVR/NVR setup, and mobile app configuration for remote monitoring.',
          iconName: 'mdi:cctv',
          cost: 800,
          fee: 1200,
        },

        // Home Maintenance Services
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Dryer Vent Cleaning',
          description:
            'Thorough cleaning of dryer vents to improve efficiency, prevent fires, and extend appliance lifespan.',
          iconName: 'mdi:air-filter',
          cost: 80,
          fee: 120,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Chimney Cleaning & Inspection',
          description:
            'Professional chimney sweeping and safety inspection to prevent blockages and ensure proper ventilation.',
          iconName: 'mdi:fireplace',
          cost: 100,
          fee: 150,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Chimney Repair',
          description:
            'Repair of damaged bricks, mortar joints, and chimney caps to restore safety and functionality.',
          iconName: 'mdi:hammer-wrench',
          cost: 200,
          fee: 200,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Gutter Cleaning',
          description:
            'Removal of leaves, debris, and blockages from gutters and downspouts to ensure proper water drainage.',
          iconName: 'mdi:broom',
          cost: 80,
          fee: 120,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Gutter Repair & Installation',
          description:
            'Repair of leaking or damaged gutters and installation of new systems to improve water flow.',
          iconName: 'mdi:home-roof',
          cost: 150,
          fee: 180,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Pressure Washing',
          description:
            'High-pressure cleaning for driveways, decks, siding, and other surfaces to remove dirt, grime, and mold.',
          iconName: 'mdi:water-pump',
          cost: 100,
          fee: 150,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Window Cleaning',
          description:
            'Interior and exterior window washing for streak-free clarity and improved curb appeal.',
          iconName: 'mdi:window-closed',
          cost: 60,
          fee: 90,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Handyman Services',
          description:
            'General repair and maintenance tasks for home upkeep, including minor fixes and installations.',
          iconName: 'mdi:hammer',
          cost: 80,
          fee: 120,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Furniture Assembly',
          description:
            'Assembly of flat-pack and custom furniture, including bed frames, desks, cabinets, and shelves.',
          iconName: 'mdi:package-variant',
          cost: 60,
          fee: 100,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Home Weatherproofing',
          description:
            'Sealing gaps, insulating windows/doors, and installing weatherstripping to improve energy efficiency.',
          iconName: 'mdi:shield',
          cost: 120,
          fee: 180,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Garage Door Repair & Installation',
          description:
            'Repair and installation of garage doors, openers, and related hardware.',
          iconName: 'mdi:garage',
          cost: 300,
          fee: 250,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Fence Repair & Installation',
          description:
            'Repair and construction of wood, vinyl, and metal fencing for security and privacy.',
          iconName: 'mdi:fence',
          cost: 200,
          fee: 300,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Deck Repair & Installation',
          description:
            'Repair, staining, and construction of wooden decks for durability and aesthetics.',
          iconName: 'mdi:deck',
          cost: 250,
          fee: 350,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Pool Maintenance & Repair',
          description:
            'Cleaning, chemical balancing, and repair of pool systems for safe and clear water.',
          iconName: 'mdi:pool',
          cost: 150,
          fee: 200,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Appliance Installation',
          description:
            'Installation of major household appliances including washers, dryers, refrigerators, and ovens.',
          iconName: 'mdi:stove',
          cost: 100,
          fee: 150,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Appliance Repair',
          description:
            'Repair services for malfunctioning household appliances, restoring them to working condition.',
          iconName: 'mdi:wrench',
          cost: 120,
          fee: 180,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Smoke & Carbon Monoxide Detector Installation',
          description:
            'Installation and testing of smoke and CO detectors for improved home safety.',
          iconName: 'mdi:smoke-detector',
          cost: 50,
          fee: 80,
        },
        {
          serviceItemId: homeMaintenance!.id,
          title: 'Smart Home Device Installation',
          description:
            'Setup of smart home devices such as thermostats, cameras, lighting systems, and security devices.',
          iconName: 'mdi:home-automation',
          cost: 80,
          fee: 120,
        },
      ],
    });

    console.log('Sub-service items seeded successfully!');
  }
}
