import mammoth from 'mammoth';
import { readFileSync } from 'fs';

const result = await mammoth.extractRawText({path: '19.02.2026 1-2 ауысым  ОҢ апта.docx'});
console.log(result.value);
