import axios from 'axios';

// Interfaces for our transformed disaster alerts
export interface ExtractedAlert {
  title: string;
  type: 'Flood' | 'Cyclone' | 'Earthquake' | 'Wildfire' | 'Landslide' | 'Drought' | 'Other';
  severity: 'Info' | 'Warning' | 'Critical';
  description: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  source: 'USGS' | 'NASA' | 'Local Authority' | 'AI Prediction';
  isActive: boolean;
  timestamp: Date;
  details?: Record<string, any>;
}

// 1. Fetch Earthquakes from USGS
export const fetchUSGSEarthquakes = async (): Promise<ExtractedAlert[]> => {
  try {
    const url = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
    const response = await axios.get(url, { timeout: 3500 });
    const features = response.data?.features || [];
    
    return features.slice(0, 15).map((feat: any) => {
      const props = feat.properties;
      const geom = feat.geometry;
      const mag = props.mag;
      
      let severity: 'Info' | 'Warning' | 'Critical' = 'Info';
      if (mag >= 5.5) severity = 'Critical';
      else if (mag >= 3.5) severity = 'Warning';

      return {
        title: props.title || `Earthquake M ${mag}`,
        type: 'Earthquake',
        severity,
        description: `Seismic event of magnitude ${mag} detected. Depth: ${geom.coordinates[2]} km. Felt reports: ${props.felt || 0}.`,
        location: {
          lat: geom.coordinates[1],
          lng: geom.coordinates[0],
          name: props.place || 'Unknown Location'
        },
        source: 'USGS',
        isActive: mag >= 4.0, // Active if moderate or above
        timestamp: new Date(props.time),
        details: { mag, depth: geom.coordinates[2], tsunami: props.tsunami }
      };
    });
  } catch (error: any) {
    console.warn('⚠️  USGS API fetch failed, falling back to mock earthquakes. Error:', error.message);
    return getMockEarthquakes();
  }
};

// 2. Fetch NASA EONET Events
export const fetchNASAEonet = async (): Promise<ExtractedAlert[]> => {
  try {
    const url = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=15';
    const response = await axios.get(url, { timeout: 3500 });
    const events = response.data?.events || [];
    
    return events.map((event: any) => {
      const title = event.title;
      const category = event.categories?.[0]?.id || 'unknown';
      const geom = event.geometry?.[0];
      const coords = geom?.coordinates; // NASA returns [lng, lat]
      
      let type: any = 'Other';
      if (category.includes('wildfire') || category.includes('fire')) type = 'Wildfire';
      else if (category.includes('severeStorms') || category.includes('storm')) type = 'Cyclone';
      else if (category.includes('floods')) type = 'Flood';
      else if (category.includes('landslides')) type = 'Landslide';
      else if (category.includes('drought')) type = 'Drought';

      let severity: 'Info' | 'Warning' | 'Critical' = 'Warning';
      if (type === 'Wildfire' || type === 'Cyclone') severity = 'Critical';

      return {
        title: title,
        type,
        severity,
        description: `NASA EONET satellite observation tracks active event categorized under '${category}'.`,
        location: {
          lat: coords ? coords[1] : 37.7749,
          lng: coords ? coords[0] : -122.4194,
          name: event.sources?.[0]?.id || 'Satellite Observation Area'
        },
        source: 'NASA',
        isActive: true,
        timestamp: new Date(geom?.date || Date.now()),
        details: { link: event.link, sources: event.sources }
      };
    });
  } catch (error: any) {
    console.warn('⚠️  NASA EONET API fetch failed, falling back to mock NASA events. Error:', error.message);
    return getMockWildfires();
  }
};

// 3. Fetch Weather Forecast using Open-Meteo
export const fetchWeatherForecast = async (lat: number, lng: number): Promise<any> => {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,windspeed_10m_max&timezone=auto`;
    const response = await axios.get(url, { timeout: 3500 });
    return response.data;
  } catch (error: any) {
    console.warn('⚠️  Open-Meteo Weather API failed, falling back to mock forecast. Error:', error.message);
    return getMockWeatherForecast(lat, lng);
  }
};

// Mock fallback generators
const getMockEarthquakes = (): ExtractedAlert[] => {
  return [
    {
      title: 'Earthquake M 6.1 - Near San Francisco Coast',
      type: 'Earthquake',
      severity: 'Critical',
      description: 'Shallow earthquake recorded 12km west of San Francisco. Expected tremors and minor building damage. Tsunamic warning evaluated: Negative.',
      location: { lat: 37.7850, lng: -122.5000, name: 'San Francisco Coast, CA' },
      source: 'USGS',
      isActive: true,
      timestamp: new Date(),
      details: { mag: 6.1, depth: 10 }
    },
    {
      title: 'Earthquake M 4.2 - Hayward Fault Zone',
      type: 'Earthquake',
      severity: 'Warning',
      description: 'Moderate earthquake recorded along the Hayward fault. Minor tremors felt in Oakland and Berkeley. No structural casualties reported.',
      location: { lat: 37.8272, lng: -122.2913, name: 'East Bay Area, CA' },
      source: 'USGS',
      isActive: true,
      timestamp: new Date(Date.now() - 3 * 3600000), // 3 hours ago
      details: { mag: 4.2, depth: 8 }
    }
  ];
};

const getMockWildfires = (): ExtractedAlert[] => {
  return [
    {
      title: 'Wildfire - Napa Valley Ridge',
      type: 'Wildfire',
      severity: 'Critical',
      description: 'Fast-moving brush fire reported on Napa Valley dry ridges. Local smoke plume expanding southwest. Firefighters on-scene. Evacuations ordered for Zone B.',
      location: { lat: 38.3000, lng: -122.3000, name: 'Napa Valley, CA' },
      source: 'NASA',
      isActive: true,
      timestamp: new Date(),
      details: { containment: '5%', areaAcres: 1200 }
    },
    {
      title: 'Wildfire - Mount Diablo State Park',
      type: 'Wildfire',
      severity: 'Warning',
      description: 'Lightning-induced forest fire detected by thermal sensors. Burning inside park boundaries. Access roads closed.',
      location: { lat: 37.8816, lng: -121.9142, name: 'Contra Costa County, CA' },
      source: 'NASA',
      isActive: true,
      timestamp: new Date(Date.now() - 8 * 3600000),
      details: { containment: '40%', areaAcres: 250 }
    }
  ];
};

const getMockWeatherForecast = (lat: number, lng: number) => {
  return {
    current_weather: {
      temperature: 24.5,
      windspeed: 15.2,
      winddirection: 210,
      weathercode: 3 // Cloudy
    },
    daily: {
      time: [
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 86400000).toISOString().split('T')[0],
        new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0]
      ],
      temperature_2m_max: [26, 28, 23],
      temperature_2m_min: [15, 16, 14],
      precipitation_probability_max: [10, 45, 90],
      windspeed_10m_max: [18, 22, 28]
    }
  };
};

// Seed mock alerts and resources to DB
export const generateInitialSeeds = () => {
  const alerts: ExtractedAlert[] = [
    ...getMockEarthquakes(),
    ...getMockWildfires(),
    {
      title: 'AI Prediction: High Risk Flash Flooding',
      type: 'Flood',
      severity: 'Warning',
      description: 'DisasterGuard AI agents predicted flash floods due to extreme moisture runoff and rain saturation in low-lying city drainages.',
      location: { lat: 37.7500, lng: -122.4400, name: 'Mission District, San Francisco, CA' },
      source: 'AI Prediction',
      isActive: true,
      timestamp: new Date(),
      details: { floodProbability: '88%', forecastRainfall: '45mm/hr' }
    },
    {
      title: 'Landslide Warning - Pacific Coast Highway',
      type: 'Landslide',
      severity: 'Critical',
      description: 'Recent soil erosion combined with brief precipitation caused minor landslide on Hwy 1. High risk of secondary slides. Avoid lane.',
      location: { lat: 37.5255, lng: -122.5126, name: 'Pacifica Coastline, CA' },
      source: 'Local Authority',
      isActive: true,
      timestamp: new Date(Date.now() - 1 * 3600000),
      details: { landslideRiskIdx: '9.2/10' }
    }
  ];

  const resources: any[] = [
    {
      name: 'San Francisco General Hospital',
      type: 'Hospital',
      capacity: { total: 450, available: 82, unit: 'Beds' },
      location: { lat: 37.7554, lng: -122.4050, address: '1001 Potrero Ave, San Francisco, CA' },
      contactPhone: '+1 415-206-8000',
      status: 'Operational'
    },
    {
      name: 'St. Mary Emergency Medical Center',
      type: 'Hospital',
      capacity: { total: 200, available: 41, unit: 'Beds' },
      location: { lat: 37.7739, lng: -122.4538, address: '450 Stanyan St, San Francisco, CA' },
      contactPhone: '+1 415-668-1000',
      status: 'Operational'
    },
    {
      name: 'Central Shelter - Bill Graham Civic Auditorium',
      type: 'Shelter',
      capacity: { total: 1000, available: 320, unit: 'People' },
      location: { lat: 37.7781, lng: -122.4174, address: '99 Grove St, San Francisco, CA' },
      contactPhone: '+1 415-978-8400',
      status: 'Operational'
    },
    {
      name: 'Secondary Shelter - Sunset Recreation Gym',
      type: 'Shelter',
      capacity: { total: 300, available: 180, unit: 'People' },
      location: { lat: 37.7569, lng: -122.4762, address: '2201 Lawton St, San Francisco, CA' },
      contactPhone: '+1 415-753-7098',
      status: 'Operational'
    },
    {
      name: 'SFFD Station 1 - Central Fire HQ',
      type: 'Fire Station',
      capacity: { total: 10, available: 8, unit: 'Engines' },
      location: { lat: 37.7798, lng: -122.4082, address: '935 Folsom St, San Francisco, CA' },
      contactPhone: '+1 415-558-3200',
      status: 'Operational'
    },
    {
      name: 'SFPD Tenderloin Police Station',
      type: 'Police Station',
      capacity: { total: 50, available: 35, unit: 'Officers' },
      location: { lat: 37.7837, lng: -122.4128, address: '301 Eddy St, San Francisco, CA' },
      contactPhone: '+1 415-345-7300',
      status: 'Operational'
    },
    {
      name: 'Red Cross Resource Warehouse',
      type: 'Food Supply',
      capacity: { total: 5000, available: 4100, unit: 'Rations' },
      location: { lat: 37.7345, lng: -122.3920, address: '120 Port Access Rd, San Francisco, CA' },
      contactPhone: '+1 415-427-8000',
      status: 'Operational'
    }
  ];

  return { alerts, resources };
};
