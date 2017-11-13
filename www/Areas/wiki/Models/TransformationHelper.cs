using System;
using System.Collections.Generic;
using System.Linq;
using Anbr.Web.SA.CoreLogic.Model;
using Anbr.Web.SA.CoreLogic.Model.wiki;
using Model.Utils;
using Omu.ValueInjecter;

namespace www.Areas.wiki.Models
{
    internal static class WikiTransformationHelper
    {
        public static WikiPointModel[] ToLocalType(this WikiPointDTO[] mDTO)
        {
            return mDTO.Select(param => param.ToLocalType()).ToArray();
        }

        public static WikiPointModel ToLocalType(this WikiPointDTO mDTO)
        {
            return (WikiPointModel)new WikiPointModel().InjectFrom(mDTO);
        }
    }
}