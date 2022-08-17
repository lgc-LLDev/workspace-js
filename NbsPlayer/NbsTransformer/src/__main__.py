import os
from optparse import OptionParser
from pathlib import Path

import pynbs

parser = OptionParser()
parser.add_option("-d", "--dir", action="store", type="string", dest="dir")

args, _ = parser.parse_args()
out_dir = Path(os.getcwd()) / 'out'
if not out_dir.exists():
    out_dir.mkdir()

ok = 0
err = 0
for i in Path(args.dir).iterdir():
    if i.suffix == '.nbs':
        try:
            nbs = pynbs.read(str(i))
            nbs.save(str(out_dir / i.name))
            print(f'√ {i.name} 转换成功')
            ok += 1
        except:
            print(f'x {i.name} 转换失败')
            err += 1
print(f'ok，成功 {ok}，失败{err}')
