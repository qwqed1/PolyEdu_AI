import mammoth from 'mammoth';
import { ScheduleUploadModel } from '../models/ScheduleUpload.js';

// Parse the docx file and extract schedule entries
function parseScheduleTable(rawText) {
  // The raw text from mammoth comes as continuous text
  // We need to parse it as table data
  // The docx has a specific structure: Room | teacher+subject | group | teacher+subject | group | ...
  return rawText;
}

// Parse the docx XML to extract table structure
async function parseDocxToEntries(buffer, shift, uploadId) {
  const AdmZip = (await import('adm-zip')).default;
  const zip = new AdmZip(buffer);
  const entry = zip.getEntry('word/document.xml');
  const xml = entry.getData().toString('utf8');

  // Extract table rows
  const trPattern = /<w:tr[^>]*>(.*?)<\/w:tr>/gs;
  const tcPattern = /<w:tc[^>]*>(.*?)<\/w:tc>/gs;
  const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;

  const rows = [];
  let trMatch;
  while ((trMatch = trPattern.exec(xml)) !== null) {
    const rowContent = trMatch[1];
    const cells = [];
    let tcMatch;
    // Reset tcPattern for each row
    const tcRegex = new RegExp(tcPattern.source, tcPattern.flags);
    while ((tcMatch = tcRegex.exec(rowContent)) !== null) {
      const cellContent = tcMatch[1];
      let cellText = '';
      let tMatch;
      const tRegex = new RegExp(textPattern.source, textPattern.flags);
      while ((tMatch = tRegex.exec(cellContent)) !== null) {
        cellText += tMatch[1];
      }
      cells.push(cellText.trim());
    }
    rows.push(cells);
  }

  // Now parse the rows into schedule entries
  const entries = [];
  
  // Detect lesson times from header rows
  let lessonTimes = {};
  
  for (const row of rows) {
    if (row.length < 2) continue;
    
    // Detect header row with lesson times
    const firstCell = row[0]?.trim();
    if (firstCell === 'Ауд' || firstCell === 'Ауд.') {
      // Parse lesson times from header
      // The cells after "Ауд" contain lesson info like "1 пара  0800- 0930"
      for (let i = 1; i < row.length; i++) {
        const timeText = row[i]?.trim();
        if (!timeText) continue;
        
        // Extract lesson number and time
        const lessonMatch = timeText.match(/(\d+)\s*пара\s*([\d:]+)\s*[-–]\s*([\d:]+)/i);
        if (lessonMatch) {
          const lessonNum = parseInt(lessonMatch[1]);
          let startTime = lessonMatch[2];
          let endTime = lessonMatch[3];
          
          // Format time properly (0800 -> 08:00)
          if (startTime.length === 4 && !startTime.includes(':')) {
            startTime = startTime.slice(0, 2) + ':' + startTime.slice(2);
          }
          if (endTime.length === 4 && !endTime.includes(':')) {
            endTime = endTime.slice(0, 2) + ':' + endTime.slice(2);
          }
          
          lessonTimes[i] = { number: lessonNum, time: `${startTime}-${endTime}` };
        }
      }
      continue;
    }
    
    // Skip empty or sport/gym rows
    if (!firstCell || firstCell.includes('Спорт')) continue;
    
    const room = firstCell;
    
    // Process pairs of cells (teacher+subject | group)
    // Cells are: [room, teacher1, group1, teacher2, group2, teacher3, group3, teacher4, group4]
    for (let pairIdx = 0; pairIdx < 4; pairIdx++) {
      const teacherIdx = 1 + pairIdx * 2;
      const groupIdx = 2 + pairIdx * 2;
      
      const teacherSubject = row[teacherIdx]?.trim() || '';
      const groupName = row[groupIdx]?.trim() || '';
      
      if (!teacherSubject || !groupName) continue;
      
      // Parse teacher and subject
      // Format is usually: "Имя РО5.1" or "Имя предмет"
      let teacher = '';
      let subject = '';
      
      // Try to split into teacher name and subject
      // The teacher name is usually the first word, subject is the rest
      const parts = teacherSubject.split(/\s+/);
      if (parts.length >= 2) {
        teacher = parts[0];
        subject = parts.slice(1).join(' ');
      } else {
        teacher = teacherSubject;
        subject = '';
      }
      
      // Determine lesson number and time
      const lessonNumber = pairIdx + 1;
      
      // Find the matching lesson time
      let lessonTime = '';
      // Try to match from the header index
      const headerIdx = teacherIdx; // The teacher cell index corresponds to the header
      if (lessonTimes[headerIdx]) {
        lessonTime = lessonTimes[headerIdx].time;
      } else {
        // Fallback: find by lesson number
        for (const key in lessonTimes) {
          if (lessonTimes[key].number === lessonNumber) {
            lessonTime = lessonTimes[key].time;
            break;
          }
        }
      }
      
      entries.push({
        upload_id: uploadId,
        room,
        lesson_number: lessonNumber,
        lesson_time: lessonTime,
        teacher,
        subject,
        group_name: groupName
      });
    }
  }
  
  return entries;
}

export const scheduleUploadController = {
  // Upload and parse a docx file
  async upload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Файл не загружен' });
      }

      const userId = req.user.id;
      const title = req.body.title || req.file.originalname;
      const shift = req.body.shift || '1-2 ауысым';
      const weekType = req.body.weekType || 'ОҢ апта';

      // Create upload record
      const upload = await ScheduleUploadModel.createUpload(userId, title, shift, weekType);

      // Parse the docx file
      const entries = await parseDocxToEntries(req.file.buffer, shift, upload.id);

      // Save entries
      if (entries.length > 0) {
        await ScheduleUploadModel.createEntries(entries);
      }

      res.json({
        message: 'Расписание успешно загружено',
        upload,
        entriesCount: entries.length,
        groups: [...new Set(entries.map(e => e.group_name))].sort()
      });
    } catch (error) {
      console.error('Schedule upload error:', error);
      res.status(500).json({ error: 'Ошибка при загрузке расписания: ' + error.message });
    }
  },

  // Get all uploads for the current user
  async getUploads(req, res) {
    try {
      const uploads = await ScheduleUploadModel.getAllUploads(req.user.id);
      res.json(uploads);
    } catch (error) {
      console.error('Get uploads error:', error);
      res.status(500).json({ error: 'Ошибка при получении загрузок' });
    }
  },

  // Get all unique group names
  async getGroups(req, res) {
    try {
      const groups = await ScheduleUploadModel.getAllGroups();
      res.json(groups);
    } catch (error) {
      console.error('Get groups error:', error);
      res.status(500).json({ error: 'Ошибка при получении групп' });
    }
  },

  // Get schedule entries by group name
  async getByGroup(req, res) {
    try {
      const { groupName } = req.params;
      const data = await ScheduleUploadModel.getLatestByGroup(decodeURIComponent(groupName));
      res.json(data);
    } catch (error) {
      console.error('Get by group error:', error);
      res.status(500).json({ error: 'Ошибка при получении расписания' });
    }
  },

  // Delete an upload
  async deleteUpload(req, res) {
    try {
      const { id } = req.params;
      const deleted = await ScheduleUploadModel.deleteUpload(id, req.user.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Загрузка не найдена' });
      }
      res.json({ message: 'Загрузка удалена', deleted });
    } catch (error) {
      console.error('Delete upload error:', error);
      res.status(500).json({ error: 'Ошибка при удалении загрузки' });
    }
  }
};
