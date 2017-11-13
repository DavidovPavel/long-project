using System.Linq;
using ANBR.Monitoring;
using Anbr.Web.SA.CoreLogic.Model.check;
using Omu.ValueInjecter;

namespace www.Areas.ExpressDossier.Models
{
    public static class ExpressDossierTransformationHelper
    {
        public static SourceModel[] ToLocalType(this GoodsLabelData[] mDTO)
        {
            return mDTO.Select(item => new SourceModel()
            {
                id = item.ProductUID,
                title = item.Title,
                description = item.Description,
                property = item.DicItems,
                price = (item.DerivativePrice ?? item.BasePrice) ?? default(decimal),
                logoUrl = item.LogoUrl,
                text = item.Text
            }).ToArray();
        }

        public static DicItemModel[] ToLocalType(this CatalogDicItemData[] mDTO)
        {
            return mDTO.Select(item => new DicItemModel()
            {
                ID = item.ID,
                DicCode = item.DicCode,
                Importance = item.Importance,
                Title = item.Title,
                DicID = item.DicID,
                DicCodeItem = item.DicCodeItem
            }).ToArray();
        }

        public static SearchPackModel ToLocalType(this SearchPackDTO mDTO)
        {
            return (SearchPackModel)new SearchPackModel().InjectFrom(mDTO);
        }

        public static SearchPackModel[] ToLocalType(this SearchPackDTO[] mDTO)
        {
            return mDTO.Select(item => item.ToLocalType()).ToArray();
        }

        public static DicModel[] ToLocalType(this CatalogDicData[] mDTO, CatalogDicItemData[] dicItems)
        {
            return mDTO.Select(item => new DicModel()
            {
                ID = item.ID,
                DicCode = item.DicCode,
                DicType = item.DicType,
                Importance = item.Importance,
                Title = item.Title,
                DicItems = dicItems.Where(ditem => ditem.DicID == item.ID)
                .Select(ditem => new DicItemModel()
                {
                    ID = ditem.ID,
                    DicCode = ditem.DicCode,
                    Importance = ditem.Importance,
                    Title = ditem.Title,
                    DicID = ditem.DicID,
                    DicCodeItem = ditem.DicCodeItem
                }).ToArray()

            }).ToArray();
        }

    }
}