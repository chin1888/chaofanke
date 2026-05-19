import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Region {
  code: string;
  name: string;
  children?: Region[];
}

interface AddressSelectorProps {
  value: {
    province: string;
    city: string;
    district: string;
  };
  onChange: (value: { province: string; city: string; district: string }) => void;
}

const regionData: Region[] = [
  {
    code: '110000',
    name: '北京市',
    children: [
      {
        code: '110100',
        name: '北京市',
        children: [
          { code: '110101', name: '东城区' },
          { code: '110102', name: '西城区' },
          { code: '110105', name: '朝阳区' },
          { code: '110106', name: '丰台区' },
          { code: '110107', name: '石景山区' },
          { code: '110108', name: '海淀区' },
          { code: '110109', name: '门头沟区' },
          { code: '110111', name: '房山区' },
          { code: '110112', name: '通州区' },
          { code: '110113', name: '顺义区' },
          { code: '110114', name: '昌平区' },
          { code: '110115', name: '大兴区' },
          { code: '110116', name: '怀柔区' },
          { code: '110117', name: '平谷区' },
          { code: '110118', name: '密云区' },
          { code: '110119', name: '延庆区' }
        ]
      }
    ]
  },
  {
    code: '310000',
    name: '上海市',
    children: [
      {
        code: '310100',
        name: '上海市',
        children: [
          { code: '310101', name: '黄浦区' },
          { code: '310104', name: '徐汇区' },
          { code: '310105', name: '长宁区' },
          { code: '310106', name: '静安区' },
          { code: '310107', name: '普陀区' },
          { code: '310109', name: '虹口区' },
          { code: '310110', name: '杨浦区' },
          { code: '310112', name: '闵行区' },
          { code: '310113', name: '宝山区' },
          { code: '310114', name: '嘉定区' },
          { code: '310115', name: '浦东新区' },
          { code: '310116', name: '金山区' },
          { code: '310117', name: '松江区' },
          { code: '310118', name: '青浦区' },
          { code: '310120', name: '奉贤区' },
          { code: '310151', name: '崇明区' }
        ]
      }
    ]
  },
  {
    code: '440000',
    name: '广东省',
    children: [
      {
        code: '440100',
        name: '广州市',
        children: [
          { code: '440103', name: '荔湾区' },
          { code: '440104', name: '越秀区' },
          { code: '440105', name: '海珠区' },
          { code: '440106', name: '天河区' },
          { code: '440111', name: '白云区' },
          { code: '440112', name: '黄埔区' },
          { code: '440113', name: '番禺区' },
          { code: '440114', name: '花都区' },
          { code: '440115', name: '南沙区' },
          { code: '440117', name: '从化区' },
          { code: '440118', name: '增城区' }
        ]
      },
      {
        code: '440300',
        name: '深圳市',
        children: [
          { code: '440303', name: '罗湖区' },
          { code: '440304', name: '福田区' },
          { code: '440305', name: '南山区' },
          { code: '440306', name: '宝安区' },
          { code: '440307', name: '龙岗区' },
          { code: '440308', name: '盐田区' },
          { code: '440309', name: '龙华区' },
          { code: '440310', name: '坪山区' },
          { code: '440311', name: '光明区' }
        ]
      },
      {
        code: '440600',
        name: '佛山市',
        children: [
          { code: '440604', name: '禅城区' },
          { code: '440605', name: '南海区' },
          { code: '440606', name: '顺德区' },
          { code: '440607', name: '三水区' },
          { code: '440608', name: '高明区' }
        ]
      }
    ]
  },
  {
    code: '330000',
    name: '浙江省',
    children: [
      {
        code: '330100',
        name: '杭州市',
        children: [
          { code: '330102', name: '上城区' },
          { code: '330103', name: '下城区' },
          { code: '330104', name: '江干区' },
          { code: '330105', name: '拱墅区' },
          { code: '330106', name: '西湖区' },
          { code: '330108', name: '滨江区' },
          { code: '330109', name: '萧山区' },
          { code: '330110', name: '余杭区' },
          { code: '330111', name: '富阳区' },
          { code: '330112', name: '临安区' },
          { code: '330113', name: '临平区' },
          { code: '330114', name: '钱塘区' },
          { code: '330122', name: '桐庐县' },
          { code: '330127', name: '淳安县' },
          { code: '330182', name: '建德市' }
        ]
      },
      {
        code: '330200',
        name: '宁波市',
        children: [
          { code: '330203', name: '海曙区' },
          { code: '330205', name: '江北区' },
          { code: '330206', name: '北仑区' },
          { code: '330211', name: '镇海区' },
          { code: '330212', name: '鄞州区' },
          { code: '330213', name: '奉化区' },
          { code: '330225', name: '象山县' },
          { code: '330226', name: '宁海县' },
          { code: '330281', name: '余姚市' },
          { code: '330282', name: '慈溪市' }
        ]
      }
    ]
  },
  {
    code: '320000',
    name: '江苏省',
    children: [
      {
        code: '320100',
        name: '南京市',
        children: [
          { code: '320102', name: '玄武区' },
          { code: '320104', name: '秦淮区' },
          { code: '320105', name: '建邺区' },
          { code: '320106', name: '鼓楼区' },
          { code: '320111', name: '浦口区' },
          { code: '320113', name: '栖霞区' },
          { code: '320114', name: '雨花台区' },
          { code: '320115', name: '江宁区' },
          { code: '320116', name: '六合区' },
          { code: '320117', name: '溧水区' },
          { code: '320118', name: '高淳区' }
        ]
      },
      {
        code: '320500',
        name: '苏州市',
        children: [
          { code: '320505', name: '虎丘区' },
          { code: '320506', name: '吴中区' },
          { code: '320507', name: '相城区' },
          { code: '320508', name: '姑苏区' },
          { code: '320509', name: '吴江区' },
          { code: '320581', name: '常熟市' },
          { code: '320582', name: '张家港市' },
          { code: '320583', name: '昆山市' },
          { code: '320585', name: '太仓市' }
        ]
      }
    ]
  },
  {
    code: '510000',
    name: '四川省',
    children: [
      {
        code: '510100',
        name: '成都市',
        children: [
          { code: '510104', name: '锦江区' },
          { code: '510105', name: '青羊区' },
          { code: '510106', name: '金牛区' },
          { code: '510107', name: '武侯区' },
          { code: '510108', name: '成华区' },
          { code: '510112', name: '龙泉驿区' },
          { code: '510113', name: '青白江区' },
          { code: '510114', name: '新都区' },
          { code: '510115', name: '温江区' },
          { code: '510116', name: '双流区' },
          { code: '510117', name: '郫都区' },
          { code: '510118', name: '新津区' },
          { code: '510121', name: '金堂县' },
          { code: '510129', name: '大邑县' },
          { code: '510131', name: '蒲江县' },
          { code: '510181', name: '都江堰市' },
          { code: '510182', name: '彭州市' },
          { code: '510183', name: '邛崃市' },
          { code: '510184', name: '崇州市' },
          { code: '510185', name: '简阳市' }
        ]
      }
    ]
  },
  {
    code: '420000',
    name: '湖北省',
    children: [
      {
        code: '420100',
        name: '武汉市',
        children: [
          { code: '420102', name: '江岸区' },
          { code: '420103', name: '江汉区' },
          { code: '420104', name: '硚口区' },
          { code: '420105', name: '汉阳区' },
          { code: '420106', name: '武昌区' },
          { code: '420107', name: '青山区' },
          { code: '420111', name: '洪山区' },
          { code: '420112', name: '东西湖区' },
          { code: '420113', name: '汉南区' },
          { code: '420114', name: '蔡甸区' },
          { code: '420115', name: '江夏区' },
          { code: '420116', name: '黄陂区' },
          { code: '420117', name: '新洲区' }
        ]
      }
    ]
  },
  {
    code: '430000',
    name: '湖南省',
    children: [
      {
        code: '430100',
        name: '长沙市',
        children: [
          { code: '430102', name: '芙蓉区' },
          { code: '430103', name: '天心区' },
          { code: '430104', name: '岳麓区' },
          { code: '430105', name: '开福区' },
          { code: '430111', name: '雨花区' },
          { code: '430112', name: '望城区' },
          { code: '430121', name: '长沙县' },
          { code: '430181', name: '浏阳市' },
          { code: '430182', name: '宁乡市' }
        ]
      }
    ]
  },
  {
    code: '500000',
    name: '重庆市',
    children: [
      {
        code: '500100',
        name: '重庆市',
        children: [
          { code: '500101', name: '万州区' },
          { code: '500102', name: '涪陵区' },
          { code: '500103', name: '渝中区' },
          { code: '500104', name: '大渡口区' },
          { code: '500105', name: '江北区' },
          { code: '500106', name: '沙坪坝区' },
          { code: '500107', name: '九龙坡区' },
          { code: '500108', name: '南岸区' },
          { code: '500109', name: '北碚区' },
          { code: '500110', name: '綦江区' },
          { code: '500111', name: '大足区' },
          { code: '500112', name: '渝北区' },
          { code: '500113', name: '巴南区' },
          { code: '500114', name: '黔江区' },
          { code: '500115', name: '长寿区' },
          { code: '500116', name: '江津区' },
          { code: '500117', name: '合川区' },
          { code: '500118', name: '永川区' },
          { code: '500119', name: '南川区' },
          { code: '500120', name: '璧山区' },
          { code: '500151', name: '铜梁区' },
          { code: '500152', name: '潼南区' },
          { code: '500153', name: '荣昌区' },
          { code: '500154', name: '开州区' },
          { code: '500155', name: '梁平区' },
          { code: '500156', name: '武隆区' }
        ]
      }
    ]
  },
  {
    code: '610000',
    name: '陕西省',
    children: [
      {
        code: '610100',
        name: '西安市',
        children: [
          { code: '610102', name: '新城区' },
          { code: '610103', name: '碑林区' },
          { code: '610104', name: '莲湖区' },
          { code: '610111', name: '灞桥区' },
          { code: '610112', name: '未央区' },
          { code: '610113', name: '雁塔区' },
          { code: '610114', name: '阎良区' },
          { code: '610115', name: '临潼区' },
          { code: '610116', name: '长安区' },
          { code: '610117', name: '高陵区' },
          { code: '610118', name: '鄠邑区' },
          { code: '610122', name: '蓝田县' },
          { code: '610124', name: '周至县' }
        ]
      }
    ]
  },
  {
    code: '370000',
    name: '山东省',
    children: [
      {
        code: '370100',
        name: '济南市',
        children: [
          { code: '370102', name: '历下区' },
          { code: '370103', name: '市中区' },
          { code: '370104', name: '槐荫区' },
          { code: '370105', name: '天桥区' },
          { code: '370112', name: '历城区' },
          { code: '370113', name: '长清区' },
          { code: '370114', name: '章丘区' },
          { code: '370115', name: '济阳区' },
          { code: '370116', name: '莱芜区' },
          { code: '370117', name: '钢城区' },
          { code: '370124', name: '平阴县' },
          { code: '370126', name: '商河县' }
        ]
      },
      {
        code: '370200',
        name: '青岛市',
        children: [
          { code: '370202', name: '市南区' },
          { code: '370203', name: '市北区' },
          { code: '370211', name: '黄岛区' },
          { code: '370212', name: '崂山区' },
          { code: '370213', name: '李沧区' },
          { code: '370214', name: '城阳区' },
          { code: '370215', name: '即墨区' },
          { code: '370281', name: '胶州市' },
          { code: '370283', name: '平度市' },
          { code: '370285', name: '莱西市' }
        ]
      }
    ]
  },
  {
    code: '410000',
    name: '河南省',
    children: [
      {
        code: '410100',
        name: '郑州市',
        children: [
          { code: '410102', name: '中原区' },
          { code: '410103', name: '二七区' },
          { code: '410104', name: '管城回族区' },
          { code: '410105', name: '金水区' },
          { code: '410106', name: '上街区' },
          { code: '410108', name: '惠济区' },
          { code: '410122', name: '中牟县' },
          { code: '410181', name: '巩义市' },
          { code: '410182', name: '荥阳市' },
          { code: '410183', name: '新密市' },
          { code: '410184', name: '新郑市' },
          { code: '410185', name: '登封市' }
        ]
      }
    ]
  },
  {
    code: '350000',
    name: '福建省',
    children: [
      {
        code: '350100',
        name: '福州市',
        children: [
          { code: '350102', name: '鼓楼区' },
          { code: '350103', name: '台江区' },
          { code: '350104', name: '仓山区' },
          { code: '350105', name: '马尾区' },
          { code: '350111', name: '晋安区' },
          { code: '350112', name: '长乐区' },
          { code: '350121', name: '闽侯县' },
          { code: '350122', name: '连江县' },
          { code: '350123', name: '罗源县' },
          { code: '350124', name: '闽清县' },
          { code: '350125', name: '永泰县' },
          { code: '350181', name: '福清市' },
          { code: '350182', name: '平潭县' }
        ]
      },
      {
        code: '350200',
        name: '厦门市',
        children: [
          { code: '350203', name: '思明区' },
          { code: '350205', name: '海沧区' },
          { code: '350206', name: '湖里区' },
          { code: '350211', name: '集美区' },
          { code: '350212', name: '同安区' },
          { code: '350213', name: '翔安区' }
        ]
      }
    ]
  },
  {
    code: '120000',
    name: '天津市',
    children: [
      {
        code: '120100',
        name: '天津市',
        children: [
          { code: '120101', name: '和平区' },
          { code: '120102', name: '河东区' },
          { code: '120103', name: '河西区' },
          { code: '120104', name: '南开区' },
          { code: '120105', name: '河北区' },
          { code: '120106', name: '红桥区' },
          { code: '120110', name: '东丽区' },
          { code: '120111', name: '西青区' },
          { code: '120112', name: '津南区' },
          { code: '120113', name: '北辰区' },
          { code: '120114', name: '宁河区' },
          { code: '120115', name: '武清区' },
          { code: '120116', name: '宝坻区' },
          { code: '120117', name: '滨海新区' },
          { code: '120118', name: '静海区' },
          { code: '120119', name: '蓟州区' }
        ]
      }
    ]
  }
];

export default function AddressSelector({ value, onChange }: AddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'province' | 'city' | 'district'>('province');
  const [selectedProvince, setSelectedProvince] = useState<Region | null>(null);
  const [selectedCity, setSelectedCity] = useState<Region | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<Region | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.province) {
      const province = regionData.find(p => p.name === value.province);
      if (province) {
        setSelectedProvince(province);
        if (value.city && province.children) {
          const city = province.children.find(c => c.name === value.city);
          if (city) {
            setSelectedCity(city);
            if (value.district && city.children) {
              const district = city.children.find(d => d.name === value.district);
              if (district) {
                setSelectedDistrict(district);
              }
            }
          }
        }
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProvinceSelect = (province: Region) => {
    setSelectedProvince(province);
    setSelectedCity(null);
    setSelectedDistrict(null);
    setActiveTab('city');
    onChange({ province: province.name, city: '', district: '' });
  };

  const handleCitySelect = (city: Region) => {
    setSelectedCity(city);
    setSelectedDistrict(null);
    setActiveTab('district');
    onChange({ province: selectedProvince!.name, city: city.name, district: '' });
  };

  const handleDistrictSelect = (district: Region) => {
    setSelectedDistrict(district);
    setIsOpen(false);
    onChange({
      province: selectedProvince!.name,
      city: selectedCity!.name,
      district: district.name
    });
  };

  const displayText = value.province
    ? `${value.province}${value.city ? ` / ${value.city}` : ''}${value.district ? ` / ${value.district}` : ''}`
    : '请选择省市区';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border rounded-lg flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
      >
        <span className={value.province ? 'text-gray-900' : 'text-gray-400'}>
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg">
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => setActiveTab('province')}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'province'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              省份
            </button>
            <button
              type="button"
              onClick={() => selectedProvince && setActiveTab('city')}
              disabled={!selectedProvince}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'city'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : selectedProvince
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              城市
            </button>
            <button
              type="button"
              onClick={() => selectedCity && setActiveTab('district')}
              disabled={!selectedCity}
              className={`flex-1 px-4 py-2 text-sm font-medium ${
                activeTab === 'district'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : selectedCity
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              区县
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto p-2">
            {activeTab === 'province' && (
              <div className="grid grid-cols-3 gap-1">
                {regionData.map((province) => (
                  <button
                    key={province.code}
                    type="button"
                    onClick={() => handleProvinceSelect(province)}
                    className={`px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between ${
                      selectedProvince?.code === province.code
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{province.name}</span>
                    {selectedProvince?.code === province.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'city' && selectedProvince?.children && (
              <div className="grid grid-cols-3 gap-1">
                {selectedProvince.children.map((city) => (
                  <button
                    key={city.code}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between ${
                      selectedCity?.code === city.code
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{city.name}</span>
                    {selectedCity?.code === city.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'district' && selectedCity?.children && (
              <div className="grid grid-cols-3 gap-1">
                {selectedCity.children.map((district) => (
                  <button
                    key={district.code}
                    type="button"
                    onClick={() => handleDistrictSelect(district)}
                    className={`px-3 py-2 text-sm rounded-lg text-left flex items-center justify-between ${
                      selectedDistrict?.code === district.code
                        ? 'bg-gray-900 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span className="truncate">{district.name}</span>
                    {selectedDistrict?.code === district.code && <Check className="w-3 h-3" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
