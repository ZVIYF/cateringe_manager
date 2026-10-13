import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSuppliers, useCreateSupplier, useUpdateSupplier } from '@/api/purchasing';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Supplier } from '@catering/shared';
import {
  Building2,
  Search,
  Plus,
  Phone,
  Mail,
  Clock,
  Edit2,
  X,
  ShoppingCart,
  Package
} from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategories, setFormCategories] = useState('');
  const [formLeadTime, setFormLeadTime] = useState('1');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useSuppliers({
    q: searchQuery.trim() || undefined
  });

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier(editingSupplier?.id ?? '');

  const suppliers = data?.data ?? [];

  // Extract all unique categories across suppliers
  const allCategories = Array.from(
    new Set(suppliers.flatMap(s => s.categories || []))
  );

  const filteredSuppliers = suppliers.filter(s => {
    if (selectedCategory !== 'ALL' && !s.categories?.includes(selectedCategory)) {
      return false;
    }
    return true;
  });

  const openCreateModal = () => {
    setEditingSupplier(null);
    setFormName('');
    setFormContactName('');
    setFormPhone('');
    setFormEmail('');
    setFormCategories('');
    setFormLeadTime('1');
    setFormNotes('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormName(supplier.name);
    setFormContactName(supplier.contactName ?? '');
    setFormPhone(supplier.phone);
    setFormEmail(supplier.email ?? '');
    setFormCategories((supplier.categories || []).join(', '));
    setFormLeadTime(String(supplier.leadTimeDays ?? 1));
    setFormNotes(supplier.notes ?? '');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formName.trim().length < 2) {
      setFormError('שם הספק חייב להכיל לפחות 2 תווים');
      return;
    }
    if (formPhone.trim().length < 9) {
      setFormError('מספר הטלפון חייב להכיל לפחות 9 ספרות');
      return;
    }

    const categoriesArray = formCategories
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const leadTime = parseInt(formLeadTime, 10);

    try {
      if (editingSupplier) {
        await updateSupplierMutation.mutateAsync({
          name: formName.trim(),
          contactName: formContactName.trim() || undefined,
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          categories: categoriesArray,
          leadTimeDays: isNaN(leadTime) ? 1 : leadTime,
          notes: formNotes.trim() || undefined
        });
      } else {
        await createSupplierMutation.mutateAsync({
          name: formName.trim(),
          contactName: formContactName.trim() || undefined,
          phone: formPhone.trim(),
          email: formEmail.trim() || undefined,
          categories: categoriesArray,
          leadTimeDays: isNaN(leadTime) ? 1 : leadTime,
          notes: formNotes.trim() || undefined
        });
      }
      setIsCreateModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'שגיאה בשמירת פרטי הספק');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Navigation tabs between Purchasing sections */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            ספקים והזמנות רכש
          </h1>
          <p className="text-sm text-slate-500">
            ניהול קטלוג ספקים מורשים, זמני אספקה, אנשי קשר והזמנות רכש
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/purchase-orders">
            <Button variant="outline" className="flex items-center gap-1.5">
              <ShoppingCart className="h-4 w-4" />
              הזמנות רכש
            </Button>
          </Link>
          <Link to="/inventory">
            <Button variant="outline" className="flex items-center gap-1.5">
              <Package className="h-4 w-4" />
              מלאי ותחזית
            </Button>
          </Link>
          <Button
            onClick={openCreateModal}
            className="bg-primary hover:bg-primary/90 text-white flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            ספק חדש
          </Button>
        </div>
      </div>

      {/* Secondary Sub-Nav Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          className="px-4 py-2 text-sm font-semibold border-b-2 border-primary text-primary"
        >
          מדריך ספקים ({suppliers.length})
        </button>
        <Link
          to="/purchase-orders"
          className="px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          הזמנות רכש
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">סה״כ ספקים פעילים</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">קטגוריות אספקה</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{allCategories.length}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">זמן אספקה ממוצע</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {suppliers.length > 0
                  ? (
                      suppliers.reduce((s, sup) => s + (sup.leadTimeDays || 1), 0) /
                      suppliers.length
                    ).toFixed(1)
                  : '0'}{' '}
                ימים
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="חיפוש לפי שם ספק, איש קשר או טלפון..."
            className="pr-9"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            הכל
          </button>
          {allCategories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Suppliers Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">טוען נתוני ספקים...</div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-red-500 font-medium">שגיאה בטעינת נתוני הספקים</p>
            <Button variant="outline" onClick={() => refetch()} className="mt-3">
              נסה שוב
            </Button>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Building2 className="h-12 w-12 mx-auto text-slate-300 mb-2" />
            <p className="font-medium text-slate-700">לא נמצאו ספקים</p>
            <p className="text-xs text-slate-400 mt-1">
              נסה לשנות את מילות החיפוש או הסינון, או הוסף ספק חדש
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">שם הספק</th>
                  <th className="px-4 py-3">איש קשר</th>
                  <th className="px-4 py-3">טלפון / אימייל</th>
                  <th className="px-4 py-3">קטגוריות אספקה</th>
                  <th className="px-4 py-3">זמן אספקה</th>
                  <th className="px-4 py-3">הערות</th>
                  <th className="px-4 py-3 text-left">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        <span>{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {supplier.contactName || <span className="text-slate-400">-</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex flex-col gap-0.5 text-xs">
                        <a
                          href={`tel:${supplier.phone}`}
                          className="flex items-center gap-1 hover:text-primary font-mono"
                          dir="ltr"
                        >
                          <Phone className="h-3 w-3 text-slate-400" />
                          {supplier.phone}
                        </a>
                        {supplier.email && (
                          <a
                            href={`mailto:${supplier.email}`}
                            className="flex items-center gap-1 hover:text-primary text-slate-400"
                          >
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {supplier.categories && supplier.categories.length > 0 ? (
                          supplier.categories.map(cat => (
                            <Badge
                              key={cat}
                              variant="outline"
                              className="bg-slate-50 text-slate-700 text-xs py-0"
                            >
                              {cat}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">כללי</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span>{supplier.leadTimeDays ?? 1} ימים</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate text-xs">
                      {supplier.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/purchase-orders?supplierId=${supplier.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs flex items-center gap-1"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            הזמנות
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(supplier)}
                          className="h-8 w-8 p-0 text-slate-600 hover:text-slate-900"
                          title="ערוך ספק"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create/Edit Supplier */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-lg font-bold text-slate-900">
              {editingSupplier ? 'עריכת פרטי ספק' : 'הוספת ספק מורשה חדש'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              פרטי הספק, דרכי התקשרות, קטגוריות וזמן אספקה
            </p>

            <form onSubmit={handleSubmitForm} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs font-medium border border-red-200">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  שם הספק *
                </label>
                <Input
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="לדוגמה: עוף טוב בע״מ"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    איש קשר
                  </label>
                  <Input
                    value={formContactName}
                    onChange={e => setFormContactName(e.target.value)}
                    placeholder="שם נציג הספק"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    טלפון *
                  </label>
                  <Input
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="050-1234567"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    אימייל להזמנות
                  </label>
                  <Input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="orders@supplier.co.il"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    זמן אספקה (בימים)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formLeadTime}
                    onChange={e => setFormLeadTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  קטגוריות אספקה (מופרדות בפסיקים)
                </label>
                <Input
                  value={formCategories}
                  onChange={e => setFormCategories(e.target.value)}
                  placeholder="בשרים, עופות, דגים"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  הערות ותנאי תשלום
                </label>
                <Input
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="שוטף + 30, מינימום הזמנה 500 ש״ח..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  ביטול
                </Button>
                <Button
                  type="submit"
                  disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {editingSupplier ? 'שמור שינויים' : 'הוסף ספק'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
