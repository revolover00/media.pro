const fs = require('fs');
const filePath = 'src/components/ImageTools.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// Update targetFormat state type
code = code.replace(
  /useState\<'image\/jpeg' \| 'image\/png' \| 'image\/webp'\>\('image\/webp'\)/,
  "useState<string>('image/jpeg')"
);

// Update UploadZone accept property and subtitle
code = code.replace(
  /accept="image\/png, image\/jpeg, image\/webp"/,
  'accept="image/*"'
);
code = code.replace(
  /subtitle="ندعم صيغ الصور PNG, JPG, JPEG, WEBP حتى حجم 50 ميجابايت"/,
  'subtitle="ندعم جميع صيغ الصور (PNG, JPG, WEBP, GIF, BMP, TIFF, ICO, إلخ) حتى حجم 50 ميجابايت"'
);

// Update target format buttons to a larger list
const oldFormatButtons = `<div className="grid grid-cols-3 gap-2">
                      {(['image/webp', 'image/jpeg', 'image/png'] as const).map((fmt) => (
                        <button
                          key={fmt}
                          id={\`target-format-\${fmt.split('/')[1]}\`}
                          onClick={() => setTargetFormat(fmt)}
                          className={\`
                            py-3 px-2 rounded-xl text-xs font-bold transition-all border
                            \${targetFormat === fmt 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' 
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-350'
                            }
                          \`}
                        >
                          {fmt === 'image/jpeg' ? 'JPEG' : fmt === 'image/png' ? 'PNG' : 'WEBP'}
                        </button>
                      ))}
                    </div>`;

const newFormatButtons = `<div className="grid grid-cols-4 gap-2">
                      {[
                        { mime: 'image/jpeg', label: 'JPG' },
                        { mime: 'image/png', label: 'PNG' },
                        { mime: 'image/webp', label: 'WEBP' },
                        { mime: 'image/gif', label: 'GIF' },
                        { mime: 'image/bmp', label: 'BMP' },
                        { mime: 'image/tiff', label: 'TIFF' },
                        { mime: 'image/x-icon', label: 'ICO' },
                        { mime: 'image/avif', label: 'AVIF' }
                      ].map((fmt) => (
                        <button
                          key={fmt.mime}
                          id={\`target-format-\${fmt.mime.split('/')[1]}\`}
                          onClick={() => setTargetFormat(fmt.mime)}
                          className={\`
                            py-2 px-1 rounded-xl text-xs font-bold transition-all border
                            \${targetFormat === fmt.mime 
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-100' 
                              : 'bg-white text-gray-700 border-gray-200 hover:border-purple-350'
                            }
                          \`}
                        >
                          {fmt.label}
                        </button>
                      ))}
                    </div>`;

code = code.replace(oldFormatButtons, newFormatButtons);

code = code.replace(
  /\{targetFormat !== 'image\/png' && \(/,
  "{!['image/png', 'image/gif', 'image/bmp', 'image/x-icon'].includes(targetFormat) && ("
);

code = code.replace(
  /extension = targetFormat\.split\('\/'\)\[1\];/,
  "extension = targetFormat.split('/')[1]; if (extension === 'x-icon') extension = 'ico';"
);

fs.writeFileSync(filePath, code);
console.log('Done!');
