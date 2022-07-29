from optparse import OptionParser

import pynbs
import ujson

parser = OptionParser()
parser.add_option("-f", "--file", action="store", type="string", dest="file")
parser.add_option("-o", "--out", action="store", type="string", dest="out", default="")

args, _ = parser.parse_args()
nbs = pynbs.read(args.file)

out = ujson.dumps(
    {
        'header': nbs.header.__dict__,
        'notes': [x.__dict__ for x in nbs.notes],
        'layers': [x.__dict__ for x in nbs.layers],
        'instruments': [x.__dict__ for x in nbs.instruments]
    }
)
if args.out:
    with open(args.out, 'w', encoding='utf-8') as f:
        f.write(out)
else:
    print(out)
