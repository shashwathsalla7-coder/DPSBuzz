import fs from 'fs';

let content = fs.readFileSync('src/lib/schoolFeatures.ts', 'utf8');

// 1. Add LostFoundItem interface
const interfaceCode = `export interface LostFoundItem {
  id: string;
  title: string;
  category: string;
  status: 'LOST' | 'FOUND' | 'CLAIMED';
  location: string;
  specificSpot: string;
  description: string;
  imageUrl?: string;
  reporterUsername: string;
  reporterName: string;
  reporterClass: string;
  reporterSection: string;
  reporterRole?: string;
  finderUsername?: string;
  finderName?: string;
  finderClass?: string;
  finderSection?: string;
  finderNotes?: string;
  storageLocation: string;
  urgent: boolean;
  createdAt: string;
  resolvedAt?: string | null;
}

// ----------------------------------------------------------------------------`;

content = content.replace('// ----------------------------------------------------------------------------', interfaceCode);

// 2. Add dbLostFound variable
content = content.replace(
  'let dbStudySchedules: DailyStudySchedule[] = [];',
  'let dbStudySchedules: DailyStudySchedule[] = [];\nlet dbLostFound: LostFoundItem[] = [];'
);

// 3. Add sync logic in syncFromDatabase
const syncTarget = `        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));`;
const syncReplacement = `        if (Array.isArray(data.lostFound)) {\n          dbLostFound = data.lostFound;\n        }\n        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));`;
content = content.replace(syncTarget, syncReplacement);

// 4. Add methods to SchoolFeatures object
const methodsCode = `  // --- LOST & FOUND ---
  getLostFoundItems(): LostFoundItem[] {
    return dbLostFound;
  },

  async reportLostFound(data: {
    title: string;
    category: string;
    status: 'LOST' | 'FOUND';
    location: string;
    specificSpot?: string;
    description?: string;
    imageUrl?: string;
    reporterUsername: string;
    reporterName: string;
    reporterClass: string;
    reporterSection: string;
    urgent?: boolean;
  }): Promise<LostFoundItem> {
    const optimistic: LostFoundItem = {
      id: \`DPS-LF-\${1043 + Math.floor(Math.random() * 9000)}\`,
      title: data.title.trim(),
      category: data.category,
      status: data.status,
      location: data.location,
      specificSpot: data.specificSpot || data.location,
      description: data.description || 'Reported on DPSBuzz',
      imageUrl: data.imageUrl || '',
      reporterUsername: data.reporterUsername,
      reporterName: data.reporterName,
      reporterClass: data.reporterClass,
      reporterSection: data.reporterSection,
      reporterRole: 'student',
      storageLocation: data.status === 'FOUND' ? 'Main Reception — Lost & Found Desk' : 'Not yet turned in',
      urgent: Boolean(data.urgent || data.status === 'LOST'),
      createdAt: 'Just now',
    };

    dbLostFound = [optimistic, ...dbLostFound];
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'report_lost_found',
          ...data,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.item) {
          dbLostFound = [d.item, ...dbLostFound.filter((i) => i.id !== optimistic.id)];
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
          }
          return d.item;
        }
      }
    } catch (e) {
      console.error('Failed to report lost/found to database:', e);
    }
    return optimistic;
  },

  async markItemFound(data: {
    itemId: string;
    finderUsername: string;
    finderName: string;
    finderClass: string;
    finderSection: string;
    finderNotes?: string;
  }): Promise<boolean> {
    const item = dbLostFound.find((i) => i.id === data.itemId);
    if (item) {
      item.status = 'FOUND';
      item.finderUsername = data.finderUsername;
      item.finderName = data.finderName;
      item.finderClass = data.finderClass;
      item.finderSection = data.finderSection;
      item.finderNotes = data.finderNotes || '';
      item.storageLocation = 'Found by classmate • Direct Handover Pending';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_item_found',
          ...data,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async claimLostFound(itemId: string): Promise<boolean> {
    const item = dbLostFound.find((i) => i.id === itemId);
    if (item) {
      item.status = 'CLAIMED';
      item.storageLocation = 'Reunited with owner • Handover Complete';
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('dpsbuzz:campus_updated'));
      }
    }

    try {
      const res = await fetch('/api/campus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'claim_lost_found',
          itemId,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};`;

content = content.replace(/\n\};\s*$/, '\n' + methodsCode);

fs.writeFileSync('src/lib/schoolFeatures.ts', content, 'utf8');
console.log('Successfully patched schoolFeatures.ts with Lost & Found!');
