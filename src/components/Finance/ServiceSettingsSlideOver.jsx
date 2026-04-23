import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { X, Plus, Trash2, Tag, DollarSign, Loader2, Package, Minus, Search } from 'lucide-react';

const ServiceSettingsSlideOver = ({ isOpen, onClose }) => {
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]); // საწყობის სია
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [newService, setNewService] = useState({ 
    name: '', 
    price: '', 
    materials: [] // არჩეული მასალები
  });

  useEffect(() => {
    const user = auth.currentUser;
    if (!user || !isOpen) return;

    // სერვისების წამოღება
    const qServices = query(collection(db, "services"), where("clinicId", "==", user.uid));
    const unsubServices = onSnapshot(qServices, (snapshot) => {
      setServices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // საწყობის წამოღება
    const qInv = query(collection(db, "inventory"), where("clinicId", "==", user.uid));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubServices();
      unsubInv();
    };
  }, [isOpen]);

  const addMaterialToService = (item) => {
    if (newService.materials.find(m => m.id === item.id)) return;
    setNewService({
      ...newService,
      materials: [...newService.materials, { id: item.id, name: item.name, unit: item.unit, amount: 1 }]
    });
    setSearchTerm("");
  };

  const updateMaterialAmount = (id, delta) => {
    setNewService({
      ...newService,
      materials: newService.materials.map(m => 
        m.id === id ? { ...m, amount: Math.max(0.1, m.amount + delta) } : m
      )
    });
  };

  const removeMaterial = (id) => {
    setNewService({
      ...newService,
      materials: newService.materials.filter(m => m.id !== id)
    });
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name || !newService.price) return;

    setLoading(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "services"), {
        clinicId: user.uid,
        name: newService.name,
        price: Number(newService.price),
        materials: newService.materials, // მასალების მასივი
        createdAt: serverTimestamp()
      });
      setNewService({ name: '', price: '', materials: [] });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "services", id));
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-hidden font-nino text-slate-900">
      <div className="absolute inset-0 bg-brand-deep/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md animate-in slide-in-from-right duration-300">
          <div className="h-full flex flex-col bg-white shadow-2xl rounded-l-[40px] overflow-hidden border-l border-gray-100">
            
            {/* Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-brand-deep italic tracking-tighter">სერვისების მართვა</h2>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">ფასები და მასალების ხარჯი</p>
              </div>
              <button onClick={onClose} className="p-2.5 text-gray-400 hover:bg-white rounded-xl shadow-sm transition-all cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Form Section */}
              <div className="p-8 space-y-6 bg-white">
                <form onSubmit={handleAddService} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">მომსახურების დასახელება</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="text" 
                        required
                        placeholder="მაგ: კბილის დაბჟენა"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-brand-purple transition-all"
                        value={newService.name}
                        onChange={(e) => setNewService({...newService, name: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 italic">სტანდარტული ფასი (₾)</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="number" 
                        required
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-brand-purple transition-all"
                        value={newService.price}
                        onChange={(e) => setNewService({...newService, price: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Material Integration Section */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[10px] font-black text-brand-purple uppercase tracking-widest ml-2 italic flex items-center gap-2">
                      <Package size={14} /> საჭირო მასალები (ავტო-ჩამოწერა)
                    </label>
                    
                    {/* Search Inventory */}
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                      <input 
                        type="text" 
                        placeholder="მოძებნე საწყობში..."
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-xl outline-none font-bold text-[12px] border border-gray-100 focus:border-brand-purple"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      {searchTerm && (
                        <div className="absolute top-full left-0 w-full bg-white border border-gray-100 shadow-xl rounded-xl mt-1 z-50 max-h-48 overflow-y-auto">
                          {inventory.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => addMaterialToService(item)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center border-b border-gray-50 last:border-0"
                            >
                              <span className="text-[12px] font-bold">{item.name}</span>
                              <span className="text-[10px] text-gray-400 uppercase">{item.unit}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Materials List */}
                    <div className="space-y-2">
                      {newService.materials.map(mat => (
                        <div key={mat.id} className="flex items-center justify-between p-3 bg-brand-purple/5 rounded-xl border border-brand-purple/10">
                          <span className="text-[12px] font-black text-brand-deep">{mat.name}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1 shadow-sm border border-gray-100">
                              <button type="button" onClick={() => updateMaterialAmount(mat.id, -1)} className="text-gray-400 hover:text-red-500"><Minus size={14}/></button>
                              <span className="text-[11px] font-black w-8 text-center">{mat.amount}</span>
                              <button type="button" onClick={() => updateMaterialAmount(mat.id, 1)} className="text-gray-400 hover:text-emerald-500"><Plus size={14}/></button>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 uppercase w-8">{mat.unit}</span>
                            <button type="button" onClick={() => removeMaterial(mat.id)} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-5 bg-brand-purple text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-brand-purple/20 hover:bg-brand-deep transition-all flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /> სერვისის დამატება</>}
                  </button>
                </form>
              </div>

              {/* List of Services */}
              <div className="p-8 space-y-3">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic flex items-center gap-2">
                   არსებული კატალოგი <span className="w-1.5 h-1.5 bg-gray-200 rounded-full"/> {services.length} სერვისი
                </h4>
                {services.map((s) => (
                  <div key={s.id} className="group p-5 bg-slate-50 rounded-[28px] border border-transparent hover:border-brand-purple/10 hover:bg-white hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-black text-brand-deep text-sm tracking-tighter uppercase">{s.name}</p>
                        <p className="text-[12px] font-black text-brand-purple italic">{s.price} ₾</p>
                      </div>
                      <button 
                        onClick={() => handleDelete(s.id)}
                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {s.materials?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 border-t border-gray-100 pt-3 mt-2">
                        {s.materials.map((m, idx) => (
                          <span key={idx} className="text-[8px] font-black uppercase tracking-tighter bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                            {m.name}: {m.amount} {m.unit}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceSettingsSlideOver;